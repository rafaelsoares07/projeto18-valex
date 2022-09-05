import { Router } from "express";
import * as cardsContoller from "../controllers/cardsController"


const cardsRouter = Router()



cardsRouter.post("/cards", cardsContoller.create)
cardsRouter.post("/cards/:id/activate", cardsContoller.active)
cardsRouter.post("/cards/:id/recharge", cardsContoller.recharge)
cardsRouter.post("/cards/:id/payment", cardsContoller.payment)
cardsRouter.get("/cards/transacoes/:id", cardsContoller.transactions)
cardsRouter.post("/cards/status/:id", cardsContoller.statusCard)
export default cardsRouter
