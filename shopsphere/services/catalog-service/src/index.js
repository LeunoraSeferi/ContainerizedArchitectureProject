import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import productsRoutes from "./routes/products.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import searchRoutes from "./routes/search.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import solrAdminRoutes from "./routes/solrAdmin.routes.js";



dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());


// Versioning
app.use("/api/v1", productsRoutes);
app.use("/api/v1", categoriesRoutes);
app.use("/api/v1", searchRoutes);
app.use("/api/v1", solrAdminRoutes);




// Swagger
const swaggerDocument = YAML.load("./src/docs/swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health
app.get("/health", (req, res) => res.json({ status: "ok", service: "catalog-service" }));

// Errors last
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Catalog service running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});
