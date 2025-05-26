<div style="width:20%; height:20%">

![ReadyBot Logo](images/logo.png)

</div>

# ReadyBot - Survey Smarter Not Harder

> **ReadyBot** : Turns static surveys into engaging, LLM‑driven conversations and scores every answer on the fly.

---

## 🔧 Tech Stack

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white">
  <img alt="Material‑UI" src="https://img.shields.io/badge/MUI-007FFF?logo=mui&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white">
  <img alt="Sequelize" src="https://img.shields.io/badge/Sequelize-52B0E7?logo=sequelize&logoColor=white">
  <img alt="OpenAI" src="https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
</p>

---

## 🚀 Quick Start

### Development setup

```bash
git clone https://github.com/your‑org/readybot.git
cd readybot

# databases
createdb readybot_dev
# environment
cp backend/.env.example backend/.env   # edit secrets
cp frontend/.env.example frontend/.env

# install & run
cd backend && npm install && npm run dev      # http://localhost:5000
cd ../frontend && npm install && npm run dev  # http://localhost:3000
```

### Docker (one‑liner)

```bash
docker compose up --build          # frontend :3000 | api :5000 | db :5432
```

Set `OPENAI_API_KEY` in your shell or override in *docker‑compose.yml*.

---

## 🎮 Using ReadyBot

1. **Sign‑up** as an admin and create questions (optionally add “quality answer” notes).  
2. Bundle questions into a survey and click **Generate Link**.  
3. Share the link – participants are greeted by the chatbot and guided question‑by‑question.  
4. Responses and 1‑5 quality scores stream into your dashboard in real time.

---

## 🤖 How it Works

| Process | Plain‑English Explanation |
|---------|---------------------------|
| **Intent Classification** | Every participant message is sent to the LLM with a prompt asking *“What is the user trying to do?”*. It replies in JSON (answer / skip / go‑back / help). |
| **Answer Scoring** | When an answer is submitted, the LLM receives the answer, the question text and (if provided) the admin’s quality guidelines, and returns a number **1–5** describing answer quality. |
| **Hint Generation** | If the score is below a threshold, the same call asks the model for a one‑sentence tip the participant can use to improve. |
| **Model Evaluation Harness** | A curated set of Q&A pairs is replayed across multiple candidate models. The harness records average score, completeness, latency, token usage and $$ cost, then prints a comparison report. |
| **Observability** | Every live interaction logs timestamp, latency, tokens and quality score into Postgres → Grafana dashboards and alerts on drift. |

---

## 📊 Evaluation & Continuous QA

* **Benchmark suite** – Golden answers + expected scores used as “unit tests” for the LLM layer (run in CI).  
* **A/B or Canary** – Route a slice of production traffic to a cheaper model and compare live metrics against baseline gates:  
  * Δ Quality ≤ 0.5, Δ Completeness ≤ 0.1, p95 Latency ≤ 2 s.  
* **Automated report** – `npm run evaluate` generates CSV + HTML dashboards so you can spot trade‑offs between cost and quality before rolling out.  
* **Contract tests** – JSON schemas for every LLM tool call prevent breaking changes.  

---

## 📑 Appendix

### Key Features

| Feature | Summary |
|---------|---------|
| Question CRUD & guidelines | Admin UI to add / edit questions and optional “what good looks like” notes |
| Shareable survey links | One‑click link generation with unique ID |
| Conversational flow | Chatbot enforces order but lets users jump around |
| Automated scoring | 1‑5 quality score per answer |
| Improvement hints | Friendly suggestions when answers are weak |
| Multi‑model ready | Swap LLMs via **LLMConfig** without code changes |
| Evaluation harness | Compare cost & quality across models |
| Observability | Token, latency & score metrics stored for dashboards |

### Data Model Cheat‑sheet

| Model | Important fields |
|-------|-----------------|
| **Admin** | `id`, `username`, `email`, `passwordHash` |
| **Question** | `id`, `text`, `qualityGuidelines`, `createdBy` |
| **Survey** | `id`, `title`, `uniqueId`, `shareableLink`, `llmConfigs` |
| **Response** | `id`, `surveyId`, `answers[]`, `qualityScore`, `hint` |
| **LLMConfig** | `id`, `task`, `modelName`, `temperature` |
| **ModelEvaluation** | `id`, `models[]`, `metricsJSON` |

---

### (MIT License)
