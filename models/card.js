export default function initCard(sequelize, DataTypes) {

    return sequelize.define("card", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        alias: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        attack_points: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        defense_points: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cost: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        img: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    },
    {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    });

}