# Python failing test — run with: python -m pytest test_failing.py
# Requires: pip install pytest  (if not already installed)

def test_addition_fails():
    """This test is intentionally wrong to trigger the extension sound."""
    assert 1 + 1 == 3, "Expected 2 but got something else"

def test_string_fails():
    """Another intentional failure."""
    assert "hello" == "world", "Strings do not match"
