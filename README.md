# Rehab Census & Risk Dashboard

A healthcare operations analytics dashboard for addiction treatment facilities. It ingests synthetic rehab facility data modeled on Kipu EHR's structure, stores it in Azure SQL, and uses AWS Bedrock (Claude Sonnet) to generate operational summaries and flag at-risk patients — all without exposing any real PHI.

## Tech Stack

- **Framework:** Next.js (App Router), TypeScript strict mode
- **UI:** shadcn/ui, Tailwind CSS, Recharts
- **Database:** Azure SQL (Serverless) via Drizzle ORM + `mssql`
- **AI:** AWS Bedrock — Claude Sonnet via `@aws-sdk/client-bedrock-runtime`
- **Validation:** Zod
- **Package manager:** pnpm

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/LOUSHIABBAS/rehab-census-risk-dashboard.git
cd rehab-census-risk-dashboard

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in AZURE_SQL_CONNECTION_STRING, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `AZURE_SQL_CONNECTION_STRING` | Azure SQL connection string (serverless tier) |
| `AWS_REGION` | AWS region for Bedrock (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS access key with Bedrock invoke permissions |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |

## Built with Claude Code

This project was built using an AI-native development workflow with [Claude Code](https://claude.ai/code). See [CLAUDE.md](CLAUDE.md) for the full project spec, PHI guardrails, and working agreements.
