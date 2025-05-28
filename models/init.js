import mysql from "mysql2/promise";
import db from "./index.js";

const isDev = process.env.NODE_ENV !== "test";
const Card = db.sequelize.models.card; 

async function initializeCards() {

    await Card.bulkCreate([
         { alias: "Luke Skywalker", attack_points: 12, defense_points: 10, cost: 1, img: "luke.jpg" },
        { alias: "Darth Vader", attack_points: 15, defense_points: 14, cost: 1, img: "vader.jpg" },
        { alias: "Leia Organa", attack_points: 10, defense_points: 12, cost: 1, img: "leia.jpg" },
        { alias: "Obi-Wan Kenobi", attack_points: 13, defense_points: 11, cost: 1, img: "obiwan.jpg" },
        { alias: "Yoda", attack_points: 14, defense_points: 16, cost: 1, img: "yoda.jpg" },
        { alias: "Han Solo", attack_points: 11, defense_points: 9, cost: 1, img: "han_solo.jpg" },
        { alias: "Chewbacca", attack_points: 13, defense_points: 13, cost: 1, img: "chewbacca.jpg" },
        { alias: "Rey", attack_points: 12, defense_points: 12, cost: 1, img: "rey.jpg" },
        { alias: "Kylo Ren", attack_points: 14, defense_points: 13, cost: 1, img: "kylo.jpg" },
        { alias: "Finn", attack_points: 10, defense_points: 10, cost: 1, img: "finn.jpg" },
        { alias: "Poe Dameron", attack_points: 11, defense_points: 9, cost: 1, img: "poe.jpg" },
        { alias: "Mace Windu", attack_points: 14, defense_points: 12, cost: 1, img: "windu.jpg" },
        { alias: "Padmé Amidala", attack_points: 9, defense_points: 11, cost: 1, img: "padme.jpg" },
        { alias: "Darth Maul", attack_points: 15, defense_points: 10, cost: 1, img: "maul.jpg" },
        { alias: "Jyn Erso", attack_points: 11, defense_points: 9, cost: 1, img: "jyn.jpg" },
        { alias: "Cassian Andor", attack_points: 10, defense_points: 10, cost: 1, img: "cassian.jpg" },
        { alias: "Ahsoka Tano", attack_points: 13, defense_points: 12, cost: 1, img: "ahsoka.jpg" },
        { alias: "Grogu", attack_points: 8, defense_points: 14, cost: 1, img: "grogu.jpg" },
        { alias: "The Mandalorian", attack_points: 13, defense_points: 13, cost: 1, img: "mando.jpg" },
        { alias: "General Grievous", attack_points: 16, defense_points: 12, cost: 1, img: "grievous.jpg" },
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
