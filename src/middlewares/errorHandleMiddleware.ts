import { NextFunction, Request, Response } from "express";

export default function errorHandleMiddleware(err:any, req:Request, res:Response, next:NextFunction){

    console.log(err)

    if(err.type==="unauthorized"){
        return res.status(401).send(err.message)
    }
    else if(err.type==="not found"){
        return res.status(400).send(err.message)
    }
    else if(err.type==="conflit"){
        return res.status(402).send(err.message)
    }
}