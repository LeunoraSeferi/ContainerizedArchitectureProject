import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { seedAdmin } from "./db/seedAdmin.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Versioning
app.use("/api/v1", authRoutes);
app.use("/api/v1", usersRoutes);

// Swagger
const swaggerDocument = YAML.load("./src/docs/swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "auth-service" })
);

// Error handler last
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

await seedAdmin();

app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});
