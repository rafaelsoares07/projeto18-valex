import { Request, Response} from "express";
import {find, insert} from "../repositories/cardRepository"
import {findById} from "../repositories/businessRepository"
import createCardSchema from "../schemas/createCardSchema";


import * as cardService from "../services/cardService"

import activateCardSchema from "../schemas/activateCardSchema";


export async function create (req:Request, res:Response) {

    const createCardData = req.body
    const {employeeId, type} = createCardData

    const validation = createCardSchema.validate(req.body)
    if(validation.error){
        return res.status(422).send('erro no body')
    }

    const apiKey = req.headers["x-api-key"] as string; // Usando o as -> 'O valor que esta vindo, é uma string' 
    
    if(!apiKey) return res.status(401).send('usuario nao autorizado')

    const resul = await cardService.create(apiKey, employeeId, type) 

    res.status(201).send(resul)
}

export async function active(req:Request , res:Response) {
    
    const {id} = req.params
    const activeCardData = req.body
    const {cvc, password} = req.body

    console.log(id)
    console.log(cvc)
    console.log(password)

    const validation = activateCardSchema.validate(activeCardData)
    if(validation.error){
        console.log(validation.error.details)

        return res.status(401).send('Erro no Body')
    }

    await cardService.active(Number(id), cvc, password)

    res.status(200).send('Cartão Ativado')
}

export async function recharge(req:Request , res:Response) {
    
    const {id} = req.params
    const {amount} = req.body

    const apiKey = req.headers["x-api-key"] as string;

    if(amount<=0){
        return res.status(400).send('amoutn menor que 0 ')
    }

    await cardService.recharge(apiKey,Number(id),amount)

    res.status(200).send('Cartão Recaregado com sucesso ')
}

export async function payment(req:Request, res:Response){
    const {id} = req.params
    const {amount,businessId,password} = req.body

    if(amount<=0){
        return res.status(400).send('amout menor que 0 ')
    }

    await cardService.payment(Number(id),password,businessId,amount)

    res.status(200).send('Compra com cartão feita com sucesso ')
}

export async function transactions(req:Request, res:Response){
    const {id} = req.params
    const {employeeId} = req.body

    const balance = await cardService.transactions(Number(id), employeeId)

    res.status(200).send(balance)
}

export async function statusCard(req:Request, res:Response){
    const {id} = req.params

    const { status, employeeId, password} =req.body

    await cardService.statusCard(Number(id),status,employeeId,password)

    res.status(200).send('Operação feita com sucesso ')
}