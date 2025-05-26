import path from "path";
import fs from "fs";
import { Sequelize, DataTypes } from "sequelize";
import initUser from "./user.js";
import initCard from "./card.js";

const dbFilePath = path.resolve("config", "db-config.json");
const dbOptFile = fs.readFileSync(dbFilePath);
const dbAllOptions = JSON.parse(dbOptFile);
dbAllOptions.dev = process.env.NODE_ENV !== "test";

const dbOptions = dbAllOptions.dev ? dbAllOptions.development : dbAllOptions.test;

const sequelize = new Sequelize(
    dbOptions.database,
    dbOptions.user,
    dbOptions.password,
    {
        dialect: dbOptions.dialect,
        pool: dbOptions.pool,
        logging: false
    },
);

initUser(sequelize, DataTypes);
initCard(sequelize, DataTypes);

const db = {};
db.sequelize = sequelize;
db.options = dbOptions;

export default db;