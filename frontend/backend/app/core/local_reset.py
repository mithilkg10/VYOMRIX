import os

print("Resetting Vyomrix Local Sandbox...")
if os.path.exists("vyomrix_local.db"):
    os.remove("vyomrix_local.db")
    print("Deleted vyomrix_local.db")
print("Done. Use start_local.ps1 to recreate.")
