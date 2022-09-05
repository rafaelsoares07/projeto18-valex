import { Router } from "express";
import * as cardsContoller from "../controllers/cardsController"


const cardsRouter = Router()



cardsRouter.post("/cards", cardsContoller.create)
cardsRouter.post("/cards/:id/activate", cardsContoller.active)
cardsRouter.post("/cards/:id/recharge", cardsContoller.recharge)
export default cardsRouter
