# Git Policy - DO NOT PUSH GAS FILES

To maintain security and follow user preferences, follow these rules strictly:

1. **Ignore Sensitive Files**: NEVER include files from the `GAS/` directory or the `.env` file in any git commits or pushes.
2. **Sensitive Information**: The files in `GAS/` and `.env` contain sensitive API keys and bank account details. Pushing them will trigger security alerts and expose private credentials.
3. **Respect .gitignore**: Do not use `git add -f` or any command that bypasses the `.gitignore` rules for the `GAS/` folder or `.env` files.
4. **Local Only**: All changes to Google Apps Script files and environment variables should remain local. 

Whenever you are asked to "push to github" or "commit changes", ensure the `GAS/` folder and `.env` files are strictly excluded.
