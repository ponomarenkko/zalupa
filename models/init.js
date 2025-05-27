import mysql from "mysql2/promise";
import db from "./index.js";

const isDev = process.env.NODE_ENV !== "test";
const Card = db.sequelize.models.card; 

async function initializeCards() {

    await Card.bulkCreate([
        { alias: "Thor", attack_points: 10, defense_points: 8, cost: 1, img: "thor.jpg" },
        { alias: "Iron Man", attack_points: 12, defense_points: 14, cost: 1, img: "ironman.jpg" },
        { alias: "Spider Man", attack_points: 14, defense_points: 12, cost: 1, img: "spiderman.png" },
        { alias: "Thanos", attack_points: 15, defense_points: 10, cost: 1, img: "thanos.jpg" },
        { alias: "Captain America", attack_points: 10, defense_points: 8, cost: 1, img: "cptn_america.jpg" },
        { alias: "Wonder Woman", attack_points: 11, defense_points: 14, cost: 1, img: "wonder_woman.png" },
        { alias: "Hulk", attack_points: 20, defense_points: 15, cost: 1, img: "hulk.jpg" },
        { alias: "Rocket", attack_points: 8, defense_points: 10, cost: 1, img: "rocket.jpg" },
        { alias: "Venom", attack_points: 14, defense_points: 13, cost: 1, img: "venom.png" },
        { alias: "Gamora", attack_points: 11, defense_points: 8, cost: 1, img: "gamora.jpg" },
        { alias: "Doctor Strange", attack_points: 10, defense_points: 8, cost: 1, img: "dr_strange.jpg" },
        { alias: "Deadpool", attack_points: 12, defense_points: 14, cost: 1, img: "deadpool.jpg" },
        { alias: "Wolverine", attack_points: 14, defense_points: 12, cost: 1, img: "wolverine.jpg" },
        { alias: "Professor X", attack_points: 15, defense_points: 10, cost: 1, img: "professor_x.jpg" },
        { alias: "Star-Lord", attack_points: 10, defense_points: 8, cost: 1, img: "star-lord.jpg" },
        { alias: "Groot", attack_points: 11, defense_points: 14, cost: 1, img: "groot.jpg" },
        { alias: "Black Panther", attack_points: 20, defense_points: 15, cost: 1, img: "black_panther.png" },
        { alias: "Ant-Man", attack_points: 8, defense_points: 10, cost: 1, img: "ant-man.jpg" },
        { alias: "Mystique", attack_points: 14, defense_points: 13, cost: 1, img: "mystique.jpg" },
        { alias: "Black Widow", attack_points: 11, defense_points: 8, cost: 1, img: "black_widow.jpg" },
    ]);

}

export default async function initialize() {

    const { host, user, password, database } = db.options;
    const conn = await mysql.createConnection({ host: host, user: user, password: password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${database};`);

    if (isDev)
        await db.sequelize.sync();
    else
        await db.sequelize.sync({ force: true });

    let existsQuery = `EXISTS (SELECT * FROM ${database}.cards)`;
    let cards = await db.sequelize.query(`SELECT ${existsQuery}`);
    
    if (!cards[0][0][existsQuery])
        await initializeCards();
    
    await conn.end();

}
