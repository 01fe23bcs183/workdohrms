# Postman Collection

This folder contains everything you need to test the HRMS API using Postman.

## Files

| File | Description |
|------|-------------|
| `HRMS_API.postman_collection.json` | Complete API collection with 70+ endpoints |
| `HRMS_Local.postman_environment.json` | Environment variables for local testing |
| `POSTMAN_SETUP.md` | Setup instructions and usage guide |
| `API_TEST_RESULTS.md` | API verification test results |

## Quick Import

1. Open Postman
2. Click **Import** (top left)
3. Drag and drop both JSON files
4. Select **HRMS Local** from environment dropdown

## Default Credentials

| Email | Password |
|-------|----------|
| <admin@hrms.local> | password |

## Auto Token Saving

The "Sign In" request automatically saves the auth token. Just run it first and all other requests will work!
