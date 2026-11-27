import asyncio
import sys
from mcp import Client
from mcp.client.stdio import StdioServerParameters

async def main():
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "app.mcp.server"],
        cwd=".",
    )

    async with Client(params) as client:
        result = await client.list_tools()
        print("STDIO MCP TOOLS:", [tool.name for tool in result.tools])

asyncio.run(main())
