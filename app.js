// const express = require("express");
// const {MongoClient} = require("mongodb");
// const request = require("request");
import express from "express";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import ejs from 'ejs';
import bodyParser from "body-parser";
import newsSchemas from './models/news.js';
import userSchemas from './models/user.js';
import daysLeft from "./src/js/bugs.js";
import {verifyPassword, generateToken, getConnectedUser, disconnect, hashPassword} from './src/auth/user.js';

const app = express();

const HOST = '0.0.0.0';
const PORT = 8000;

const DS_NAME = 'news';
const MONGO_URL = `mongodb://127.0.0.1:27017/${DS_NAME}?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.2.10`;

const connect = async ()  => {
    const client = await mongoose.connect(MONGO_URL);
    console.log('Connected Successfully to the Server!');
    return client;
}

const client = await connect();
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(import.meta.dirname+"/public"));
app.set("views", "./src/views");
app.set("view engine", "ejs");
app.engine('html', ejs.renderFile)


app.get("/", async (req, res) => {
    let user = getConnectedUser();
    let allNews = await newsSchemas.find({});
    res.render("home", {news: allNews, user: user});
});

app.get("/register", async (req, res) => {
    let user = getConnectedUser();
    res.render("register", {user: user});
});

app.get("/addNew", async (req, res) => {
    let user = getConnectedUser();
    res.render("addNew", {user: user});
});

app.post("/delete_new/:title", async (req, res) => {
    let myTutle = req.params.title;
    console.log(myTutle);
    newsSchemas.deleteOne({ title: myTutle });
    let connectedUser = getConnectedUser();
    res.render("message", {message: {error: 0, description: "New successfully deleted!"}, user: connectedUser});
});

app.post("/save_new", async (req, res) => {
    let myNew = {title: req.body.title, description: req.body.description, url: req.body.url, urltoimage: req.body.UrlToImage, publishdate: req.body.publishDate};
    console.log(myNew);
    newsSchemas.create(myNew);
    let connectedUser = getConnectedUser();
    res.render("message", {message: {error: 0, description: "New successfully inserted!"}, user: connectedUser});
});

app.post("/save_user", async (req, res) => {
    const hashedPassword = await hashPassword(req.body.pwd);
    let user = {username: req.body.name, password: hashedPassword, email: req.body.email};
    userSchemas.create(user);
    let connectedUser = getConnectedUser();
    res.render("message", {message: {error: 0, description: "User successfully inserted!"}, user: connectedUser});
});

app.post("/validate_login", async (req, res) => {
    let passwd = req.body.pwd;
    let user = await userSchemas.findOne({username: req.body.name});
    if (user) {
        const passwordOK = await verifyPassword(passwd, user.password);
        if (passwordOK) {
            generateToken(user);
            //console.log(user);    
            res.redirect("/");    
        } else {
            res.render("message", {message: {error: 1, description: "Invalid credentials!"}, user: {name:'', email: '', admin:0}});
        }
    } else {
        res.render("message", {message: {error: 1, description: "Invalid credentials!"}, user: {name:'', email: '', admin:0}});
    }
});

app.get("/login", async (req, res) => {
    let user = getConnectedUser();
    res.render("login", {user: user});
});

app.get("/logout", async (req, res) => {
    disconnect();
    res.redirect("/");   
});

app.listen(PORT, HOST, () => {
    console.log("Server started on port", PORT);
})