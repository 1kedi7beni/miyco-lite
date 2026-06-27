# Miyco Lite - Open Source Field Service Management 🚀

Welcome to **Miyco Lite**! This is the open-source, lightweight version of the powerful **Miyco FSM** platform. 
Built with Next.js, Tailwind CSS, Prisma, and SQLite, Miyco Lite is designed to be easily deployable by small teams and individual developers looking for a robust dispatching and field service tracking solution.

## 🌟 Vision: AI-Powered Field Operations
Miyco Lite is part of our initiative to bring **Enterprise-grade AI** to open-source field service operations. 
We are actively building the foundation to integrate **Anthropic's Claude AI** to power intelligent dispatching, automated work-order summarization, and predictive maintenance analysis directly within the local SQLite database.

By keeping the core open-source, we aim to empower the community to build specialized AI field-service tools.

## ✨ Core Features
- **Map-based Dispatching:** Visualize work orders on a map (powered by OpenStreetMap & Leaflet).
- **Workload Analysis:** Algorithm-driven assignments based on technician workload and priority.
- **Zero Config Database:** Uses SQLite via Prisma. No complex Docker or Postgres setups required. Just clone and run!
- **Modern UI:** Built with Tailwind CSS and Radix UI primitives for a premium "Flexy" design system.

## 🗺️ Roadmap (In Active Development)
We are actively working on expanding Miyco Lite's core capabilities. The following features are currently in our development pipeline for upcoming releases:
- [ ] **AI-Powered Dynamic Form Builder:** Create custom inspection forms for different job types.
- [ ] **Advanced Workflow Engine:** Multi-stage, customizable job workflows with conditional logic.
- [ ] **Real-time GPS Tracking:** Live tracking of technicians on the field.
- [ ] **Customer Portal & Invoicing:** Allow clients to track their service status and pay online.
- [ ] **Multi-tenant Architecture:** Built-in support for managing multiple companies/sub-contractors.
- [ ] **Mobile App Synchronization:** Offline-first syncing for technicians in low-coverage areas.

## 🚀 Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/miyco-lite.git
   cd miyco-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database & seed sample data**
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing
We welcome all contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.
Be sure to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community welcoming and inclusive.

## 🏢 Need the Full Enterprise Version?
Miyco Lite is just the tip of the iceberg. The full SaaS version of **Miyco FSM** includes:
- Dynamic Form Builders
- Advanced Workflow Engines
- Customer Portal & Invoicing
- Multi-tenant Architecture

Visit [miyco.io](https://miyco.io) to learn more.

## 📄 License
This project is licensed under the [MIT License](LICENSE).
