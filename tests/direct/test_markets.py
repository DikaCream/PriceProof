"""Direct-mode tests for PriceProof Markets (web pages and LLM answers are mocked)."""

import json

import pytest

from tests.direct.conftest import to_hex

CONTRACT = "contracts/priceproof_markets.py"
T0 = "2026-10-01T00:00:00Z"
T0_TS = 1790812800
WIKI = "https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final"
BBC = "https://www.bbc.com/sport/football/64062543"
EXTRA = "https://www.fifa.com/en/tournaments/mens/worldcup/qatar2022"
PAGE = "The final was played on 18 December 2022. Argentina won 4–2 on penalties after a 3–3 draw."
Q = "Did Argentina win the 2022 FIFA World Cup final?"
CRIT = "YES if the cited sources state that Argentina won the 2022 FIFA World Cup final, NO otherwise."


def verdict(outcome, quote="Argentina won 4–2 on penalties", src=WIKI):
    return json.dumps({"outcome": outcome, "evidence_quote": quote, "source_url": src, "reasoning": "per source"})


def setup(vm, valid=True):
    vm.clear_mocks()
    vm.warp(T0)
    vm.mock_llm(r"You review proposed", json.dumps({"valid": valid, "reason": "ok" if valid else "Question is subjective"}))


def new_market(vm, c, who, sources=None, window=300, valid=True, q=Q):
    setup(vm, valid)
    vm.sender = who
    return c.create_market(q, CRIT, sources or [WIKI, BBC], T0_TS + 120, "sports", window, 120)


def staked(vm, deploy, alice, bob, yes=300, no=200):
    c = deploy(CONTRACT)
    m = new_market(vm, c, alice)
    for who, side, amt in ((alice, "YES", yes), (bob, "NO", no)):
        vm.sender = who
        c.claim_points()
        c.stake(m["id"], side, amt)
    return c, m["id"]


def resolve_with(vm, c, mid, llm, page=PAGE, at="2026-10-01T00:03:00Z"):
    vm.clear_mocks()
    vm.warp(at)
    vm.mock_web(r"wikipedia\.org", {"status": 200, "body": page})
    vm.mock_web(r"bbc\.com", {"status": 200, "body": ("BBC Sport: " + page) if page else ""})
    vm.mock_web(r"fifa\.com", {"status": 200, "body": ("FIFA: " + page) if page else ""})
    vm.mock_llm(r"strict, neutral resolver", llm)
    return c.resolve(mid)


# ------------------------------------------------------------ creation


def test_create_valid_market(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    m = new_market(direct_vm, c, direct_alice)
    assert m["status"] == "OPEN" and m["id"] == 0 and m["category"] == "SPORTS"
    assert m["sources"] == [WIKI, BBC] and m["trusted_sources"] == [True, True]
    assert m["deadline"] == T0_TS + 120 and m["dispute_window"] == 300
    assert direct_vm.run_validator() is True
    assert direct_vm.run_validator(leader_result={"valid": False, "reason": "x"}) is False
    assert c.get_stats()["by_status"]["OPEN"] == 1


def test_invalid_market_rejected_by_ai(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    m = new_market(direct_vm, c, direct_alice, valid=False, q="Is Messi the best footballer of all time?")
    assert m["status"] == "INVALID" and "subjective" in m["invalid_reason"]
    direct_vm.sender = direct_alice
    c.claim_points()
    with direct_vm.expect_revert("not open"):
        c.stake(0, "YES", 50)
    assert c.get_markets("INVALID", 0, 10)["total"] == 1


@pytest.mark.parametrize("url,err", [
    ("http://en.wikipedia.org/wiki/X", "https"),
    ("https://bit.ly/abc", "shorteners"),
    ("https://twitter.com/fifa/status/1", "social"),
    ("https://192.168.1.1/x", "IP"),
    ("https://localhost/x", "not allowed"),
])
def test_source_rules(direct_vm, direct_deploy, direct_alice, url, err):
    c = direct_deploy(CONTRACT)
    setup(direct_vm)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert(err):
        c.create_market(Q, CRIT, [url], T0_TS + 120, "SPORTS", 300, 120)


def test_creation_input_rules(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    setup(direct_vm)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("1-3 source"):
        c.create_market(Q, CRIT, [WIKI, BBC, EXTRA, "https://apnews.com/x"], T0_TS + 120, "SPORTS", 300, 120)
    with direct_vm.expect_revert("Duplicate"):
        c.create_market(Q, CRIT, [WIKI, WIKI], T0_TS + 120, "SPORTS", 300, 120)
    with direct_vm.expect_revert("Deadline"):
        c.create_market(Q, CRIT, [WIKI], T0_TS + 10, "SPORTS", 300, 120)
    with direct_vm.expect_revert("end with"):
        c.create_market("Argentina won the final", CRIT, [WIKI], T0_TS + 120, "SPORTS", 300, 120)
    with direct_vm.expect_revert("Dispute window"):
        c.create_market(Q, CRIT, [WIKI], T0_TS + 120, "SPORTS", 5, 120)


def test_strict_domain_mode(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("owner"):
        c.set_strict_domains(True)
    direct_vm.sender = direct_alice
    c.set_strict_domains(True)
    setup(direct_vm)
    with direct_vm.expect_revert("allowlist"):
        c.create_market(Q, CRIT, ["https://someblog.example.com/post"], T0_TS + 120, "SPORTS", 300, 120)
    assert c.create_market(Q, CRIT, [WIKI], T0_TS + 120, "SPORTS", 300, 120)["status"] == "OPEN"


# ------------------------------------------------------------ staking


def test_points_and_staking(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    m = c.get_market(mid)
    assert (m["yes_total"], m["no_total"], m["pool"], m["stakers"], m["yes_pct"]) == (300, 200, 500, 2, 60)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("already claimed"):
        c.claim_points()
    with direct_vm.expect_revert("Insufficient"):
        c.stake(mid, "YES", 5000)
    with direct_vm.expect_revert("Minimum"):
        c.stake(mid, "NO", 1)
    user = c.get_user(to_hex(direct_alice))
    assert user["balance"] == 700 and user["positions"][0]["yes"] == 300
    direct_vm.warp("2026-10-01T00:02:30Z")
    assert c.get_market(mid)["status"] == "CLOSED"
    with direct_vm.expect_revert("not open"):
        c.stake(mid, "YES", 10)


# ------------------------------------------------------------ resolution


def test_resolve_before_deadline_fails(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    with direct_vm.expect_revert("after its deadline"):
        c.resolve(mid)


def test_resolve_yes_and_validator_checks(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    m = resolve_with(direct_vm, c, mid, verdict("YES"))
    assert m["status"] == "PROPOSED" and m["outcome"] == "YES" and m["dispute_open"] is True
    ev = c.get_evidence(mid)
    assert ev[0]["kind"] == "INITIAL" and ev[0]["source_url"] == WIKI and "penalties" in ev[0]["evidence_quote"]
    assert direct_vm.run_validator() is True
    # leader cites a quote that is not on the page -> validator rejects
    bad = {"outcome": "YES", "evidence_quote": "Argentina won 1-0 in extra time", "source_url": WIKI, "reasoning": ""}
    assert direct_vm.run_validator(leader_result=bad) is False
    # leader cites an undeclared source -> rejected
    bad2 = dict(bad, evidence_quote="Argentina won 4–2 on penalties", source_url="https://evil.example.com")
    assert direct_vm.run_validator(leader_result=bad2) is False
    # different outcome label -> rejected
    assert direct_vm.run_validator(leader_result={"outcome": "UNRESOLVABLE", "evidence_quote": "", "source_url": "", "reasoning": ""}) is False
    assert direct_vm.run_validator(leader_error=Exception("boom")) is False


def test_resolve_no_and_payout(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    resolve_with(direct_vm, c, mid, verdict("NO"))
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("not finalized"):
        c.claim(mid)
    direct_vm.warp("2026-10-01T00:09:00Z")
    r = c.claim(mid)  # auto-finalizes after the window
    assert r["payout"] == 500 and r["balance"] == 1300
    direct_vm.sender = direct_alice
    assert c.claim(mid)["payout"] == 0
    with direct_vm.expect_revert("Already claimed"):
        c.claim(mid)
    assert c.get_leaderboard(5)[0] == {"address": to_hex(direct_bob), "points": 1300, "markets": 1}


def test_unresolvable_refunds(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    m = resolve_with(direct_vm, c, mid, verdict("UNRESOLVABLE", "", ""))
    assert m["outcome"] == "UNRESOLVABLE"
    direct_vm.warp("2026-10-01T00:09:00Z")
    c.finalize(mid)
    for who in (direct_alice, direct_bob):
        direct_vm.sender = who
        c.claim(mid)
        assert c.get_user(to_hex(who))["balance"] == 1000


def test_quote_not_verbatim_becomes_unresolvable(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    m = resolve_with(direct_vm, c, mid, verdict("YES", "ok", WIKI))  # quote too short
    assert m["outcome"] == "UNRESOLVABLE"


def test_all_sources_down_unresolvable(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    m = resolve_with(direct_vm, c, mid, verdict("YES"), page="")
    assert m["outcome"] == "UNRESOLVABLE"


def test_finalize_rules(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    resolve_with(direct_vm, c, mid, verdict("YES"))
    with direct_vm.expect_revert("still open"):
        c.finalize(mid)
    direct_vm.warp("2026-10-01T00:09:00Z")
    assert c.finalize(mid)["status"] == "FINALIZED"
    direct_vm.sender = direct_alice
    assert c.claim(mid)["payout"] == 500


# ------------------------------------------------------------ disputes


def test_dispute_flips_outcome(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    resolve_with(direct_vm, c, mid, verdict("NO"))
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("position"):
        c.dispute(mid, "The page clearly says Argentina won.", "")
    direct_vm.sender = direct_alice
    d = c.dispute(mid, "Sources say Argentina won on penalties.", EXTRA)
    assert d["status"] == "DISPUTED" and d["dispute_source"] == EXTRA
    assert c.get_user(to_hex(direct_alice))["balance"] == 600
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"wikipedia\.org", {"status": 200, "body": PAGE})
    direct_vm.mock_web(r"bbc\.com", {"status": 200, "body": PAGE})
    direct_vm.mock_web(r"fifa\.com", {"status": 200, "body": PAGE})
    direct_vm.mock_llm(r"APPEAL ROUND", verdict("YES", src=EXTRA))
    m = c.resolve_dispute(mid)
    assert m["status"] == "FINALIZED" and m["outcome"] == "YES" and m["dispute_result"] == "FLIPPED"
    assert c.get_user(to_hex(direct_alice))["balance"] == 800  # bond back + 100 reward
    ev = c.get_evidence(mid)
    assert [e["kind"] for e in ev] == ["INITIAL", "APPEAL"] and EXTRA in ev[1]["sources"]
    assert c.claim(mid)["payout"] == 500
    assert c.get_stats()["flipped"] == 1


def test_dispute_fails_bond_slashed(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    resolve_with(direct_vm, c, mid, verdict("YES"))
    direct_vm.sender = direct_bob
    c.dispute(mid, "I think the match was replayed later.", "")
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"wikipedia\.org", {"status": 200, "body": PAGE})
    direct_vm.mock_web(r"bbc\.com", {"status": 200, "body": PAGE})
    direct_vm.mock_llm(r"APPEAL ROUND", verdict("YES"))
    m = c.resolve_dispute(mid)
    assert m["dispute_result"] == "UPHELD" and m["slashed"] == 100 and m["pool"] == 600
    direct_vm.sender = direct_alice
    assert c.claim(mid)["payout"] == 600  # stakes + slashed bond
    assert c.get_user(to_hex(direct_bob))["balance"] == 700


def test_dispute_window_closes(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = staked(direct_vm, direct_deploy, direct_alice, direct_bob)
    resolve_with(direct_vm, c, mid, verdict("YES"))
    direct_vm.warp("2026-10-01T00:09:00Z")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("window is closed"):
        c.dispute(mid, "Too late but trying anyway.", "")


def test_no_winners_refund_and_pagination(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = direct_deploy(CONTRACT)
    m = new_market(direct_vm, c, direct_alice)
    direct_vm.sender = direct_alice
    c.claim_points()
    c.stake(m["id"], "NO", 100)
    resolve_with(direct_vm, c, m["id"], verdict("YES"))
    direct_vm.warp("2026-10-01T00:09:00Z")
    assert c.claim(m["id"])["payout"] == 100  # nobody on winning side -> refund
    for _ in range(3):
        new_market(direct_vm, c, direct_alice)
    page = c.get_markets("ALL", 1, 2)
    assert page["total"] == 4 and [x["id"] for x in page["items"]] == [2, 1]
    assert c.get_config()["dispute_bond"] == 100


# ------------------------------------------------------------ dispute timeout


def disputed(vm, deploy, alice, bob):
    c, mid = staked(vm, deploy, alice, bob)
    resolve_with(vm, c, mid, verdict("YES"))  # at 00:03:00
    vm.sender = bob
    c.dispute(mid, "Validators misread the page entirely.", "")
    return c, mid


def test_dispute_timeout_refunds_all(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = disputed(direct_vm, direct_deploy, direct_alice, direct_bob)
    assert c.get_market(mid)["timeout_at"] == T0_TS + 180 + 120
    assert c.get_user(to_hex(direct_bob))["balance"] == 700
    direct_vm.warp("2026-10-01T00:05:01Z")
    direct_vm.sender = direct_alice  # anyone may expire
    m = c.expire_dispute(mid)
    assert m["status"] == "VOID_TIMEOUT" and m["dispute_result"] == "TIMEOUT"
    assert c.get_user(to_hex(direct_bob))["balance"] == 800  # bond returned
    ev = c.get_evidence(mid)
    assert ev[-1]["kind"] == "TIMEOUT" and ev[-1]["outcome"] == "VOID"
    assert c.get_position(mid, to_hex(direct_alice))["claimable"] == 300
    assert c.claim(mid)["payout"] == 300
    direct_vm.sender = direct_bob
    assert c.claim(mid)["payout"] == 200
    assert c.get_user(to_hex(direct_bob))["balance"] == 1000
    assert c.get_stats()["by_status"]["VOID_TIMEOUT"] == 1


def test_expire_dispute_too_early_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = disputed(direct_vm, direct_deploy, direct_alice, direct_bob)
    direct_vm.warp("2026-10-01T00:04:59Z")
    with direct_vm.expect_revert("timeout not reached"):
        c.expire_dispute(mid)


def test_expire_dispute_after_resolution_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, mid = disputed(direct_vm, direct_deploy, direct_alice, direct_bob)
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"wikipedia\.org", {"status": 200, "body": PAGE})
    direct_vm.mock_web(r"bbc\.com", {"status": 200, "body": PAGE})
    direct_vm.mock_llm(r"APPEAL ROUND", verdict("YES"))
    c.resolve_dispute(mid)
    direct_vm.warp("2026-10-02T00:00:00Z")
    with direct_vm.expect_revert("not disputed"):
        c.expire_dispute(mid)


def test_timeout_bounds(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    setup(direct_vm)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Dispute timeout"):
        c.create_market(Q, CRIT, [WIKI], T0_TS + 120, "SPORTS", 300, 10)
