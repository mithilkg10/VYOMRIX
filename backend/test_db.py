import asyncio
import asyncpg

async def main():
    try:
        conn = await asyncpg.connect(user='vyomrix', password='vyomrix_secret', database='vyomrix', host='localhost')
        print("Success!")
        await conn.close()
    except Exception as e:
        print(f"Failed: {e}")

asyncio.run(main())
