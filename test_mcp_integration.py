#!/usr/bin/env python3
"""
Integration test for MCP server
Tests basic functionality and tool availability
"""

import sys
import inspect
import asyncio

# Import the MCP server module
import mcp_server


def test_tool_count():
    """Test that all expected tools are defined"""
    tools = []
    for name, obj in inspect.getmembers(mcp_server):
        if inspect.iscoroutinefunction(obj) and not name.startswith('_'):
            tools.append(name)

    # Expected tools (excluding helper functions)
    expected_tools = [
        'cancel_scheduled_job',
        'get_available_services',
        'get_entities',
        'get_entity_state',
        'get_scheduled_jobs',
        'health_check',
        'schedule_action',
        'set_climate_temperature',
        'set_cover_position',
        'turn_off_entity',
        'turn_on_entity'
    ]

    for tool in expected_tools:
        assert tool in tools, f"Missing tool: {tool}"

    print(f"✓ All {len(expected_tools)} expected tools are defined")


def test_tool_signatures():
    """Test that tools have proper signatures"""
    # Check get_entities signature
    sig = inspect.signature(mcp_server.get_entities)
    params = list(sig.parameters.keys())
    assert 'domain' in params, "get_entities missing 'domain' parameter"

    # Check schedule_action signature
    sig = inspect.signature(mcp_server.schedule_action)
    params = list(sig.parameters.keys())
    required = ['entity_id', 'service', 'schedule_type', 'schedule_value']
    for param in required:
        assert param in params, f"schedule_action missing '{param}' parameter"

    print("✓ Tool signatures are correct")


def test_docstrings():
    """Test that all tools have docstrings"""
    tools = [
        mcp_server.get_entities,
        mcp_server.get_entity_state,
        mcp_server.schedule_action,
        mcp_server.get_scheduled_jobs,
        mcp_server.cancel_scheduled_job,
        mcp_server.health_check,
    ]

    for tool in tools:
        doc = inspect.getdoc(tool)
        assert doc, f"{tool.__name__} missing docstring"
        assert len(doc) > 20, f"{tool.__name__} docstring too short"

    print("✓ All tools have proper documentation")


def main():
    """Run all tests"""
    print("=== MCP Server Integration Tests ===\n")

    try:
        test_tool_count()
        test_tool_signatures()
        test_docstrings()

        print("\n✅ All tests passed!")
        return 0
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
