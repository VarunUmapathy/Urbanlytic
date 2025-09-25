# Firebase Studio

This is a Next.js and Genkit starter project in Firebase Studio, designed for building modern web applications with AI capabilities.

To get started, take a look at `src/app/page.tsx`.

## Running Locally

To run this project on your local machine, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later is recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Install Dependencies

Open a terminal in the project's root directory and run the following command to install all the necessary packages defined in `package.json`.

```bash
npm install
```

### 2. Run the Web Application

After the installation is complete, start the Next.js development server. This command will launch your application, and you can typically view it in your browser at `http://localhost:3000`.

```bash
npm run dev
```

The app will automatically reload if you make changes to the code.

### 3. Run the AI Backend (Optional)

This project uses Genkit to power its AI features. The AI backend runs as a separate process. If you want to develop or test features that rely on generative AI (like the incident analysis), you need to run the Genkit development server.

Open a **new terminal window** (leaving the Next.js server running) and run:

```bash
npm run genkit:dev
```

This starts the Genkit server, which listens for requests from your web application to perform AI-related tasks.
