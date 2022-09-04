import { Router } from "express";
import * as cardsContoller from "../controllers/cardsController"


const cardsRouter = Router()


cardsRouter.get("/cards", cardsContoller.get)
cardsRouter.post("/cards", cardsContoller.create)

export default cardsRouter
