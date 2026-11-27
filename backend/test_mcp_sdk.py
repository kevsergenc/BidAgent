import asyncio
from mcp import Client
from mcp.server import MCPServer

server = MCPServer("BidAgent-Test")

@server.tool()
def add_numbers(a: int, b: int) -> int:
    """İki sayıyı toplar."""
    return a + b

async def main():
    async with Client(server) as client:
        tools = await client.list_tools()
        print("TOOLS:", [tool.name for tool in tools.tools])

        result = await client.call_tool(
            "add_numbers",
            {"a": 2, "b": 3},
        )
        print("RESULT:", result.structured_content or result.content)

asyncio.run(main())
