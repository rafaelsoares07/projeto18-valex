import { findByApiKey } from "../repositories/companyRepository";
import { findById } from "../repositories/employeeRepository";
import { findByTypeAndEmployeeId , insert} from "../repositories/cardRepository";
import * as cardRepository from "../repositories/cardRepository";
import * as rechargeRepository from "../repositories/rechargeRepository"
import * as businessRepository from "../repositories/businessRepository"
import * as paymentRepository from "../repositories/paymentRepository"

import { faker } from '@faker-js/faker';
import dayjs from "dayjs";
import Cryptr from "cryptr";
import bcrypt from "bcrypt"

export async function create(
    apiKey: string,
    employeeId: number,
    type: "groceries"| "restaurant"| "transport"| "education"| "health" //podemos fazer isso no typescript 
){
    const company = await findByApiKey(apiKey)
    if(!company){
        throw {type:'unauthorized' , message:'Chave de Api Key está incorreta'}
    }

    const employee = await findById(employeeId)
    console.log(employee)
    if(!employee){
        throw {type:'not found' , message:'Usuario não encontrado'}
    }

    const existingCard = await findByTypeAndEmployeeId(type , employeeId)
    console.log(existingCard)
    if(existingCard){
        throw {type:"conflit" , message:"já tem um card cadastrado para esse user informado"}
    }

    const cardNumber = faker.finance.creditCardNumber()
   
    const cryptr = new Cryptr("senhasenha");
    const cardCVV = faker.finance.creditCardCVV()
    const cvvEncrip = cryptr.encrypt(cardCVV);
    console.log(cardCVV)

    //Destruturacao de array com spread operator [ , , c] = ["morango", "banana", "cenoura"] -> pegaria só cenoura
    const [firstName, ...outherNames] = employee.fullName.split(" ")
    const namesValid = outherNames.filter((el)=> el.length>3)
    const lastName = namesValid.pop() // ou poderia ser namesValid.pop()
    const cardName = `${firstName} ${namesValid.map(name => name[0]).join(" ")} ${lastName}`.toLocaleUpperCase();

    const expirationDate = dayjs().add(5, 'year').format('MM/YY');

    const newCard = {
        employeeId,
        number: cardNumber,
        cardholderName:cardName,
        securityCode: cvvEncrip,
        expirationDate,
        isVirtual: false,
        isBlocked: true,
        type
    }

    await insert(newCard)

    return `O codígo cvv do seu cartão é ${cardCVV}`
}

export async function active(id:number , cvc:string, password:string){

    const card = await cardRepository.findById(id)
    console.log(card)
    if(!card){
        throw {type:'not found' , message:'O cartão deve existir para poder ser ativado '}
    }
    
    const today = dayjs().format("MM/YY");
    if (dayjs(today).isAfter(dayjs(card.expirationDate))){
        throw {type : "bad_request" , message:"cartão já expirou"} 
    }  

    const isAlreadyActive = card.password;
    if(isAlreadyActive){
        throw {type:"bad_request" ,message:"cartão já foi ativado"}
    }


    const cryptr = new Cryptr("senhasenha");

    if (cvc !== cryptr.decrypt(card.securityCode)) {
        throw { type: "unauthorized", message:"codigo de seguranca invalido"}
    }

    if(password.length !== 4){
        throw {type: "bad_request", message:"senha deve conter 4 caracters numericos "}
    }

    const passwordHash = bcrypt.hashSync(password,8);

    await cardRepository.update(id, { password: passwordHash });
}
    
export async function recharge(apiKey:string, id:number, amount:number ){
    const company = await findByApiKey(apiKey)
    if(!company){
        throw {type:'unauthorized' , message:'Chave de Api Key está incorreta'}
    }

    const card = await cardRepository.findById(id)
    if(!card){
        throw {type:'not found' , message:'O cartão deve existir para poder ser ativado '}
    }

    const isAlreadyActive = card.password;
    if(!isAlreadyActive){
        throw {type:"bad_request" ,message:"cartão não esta ativado"}
    }

    const today = dayjs().format("MM/YY");
    if (dayjs(today).isAfter(dayjs(card.expirationDate))){
        throw {type : "bad_request" , message:"cartão já expirou"} 
    } 


    await rechargeRepository.insert({cardId:id, amount})

}

export async function payment(id:number, password:string, businessId:number, amount: number){
   
    const card = await cardRepository.findById(id)
    if(!card){
        throw {type:'not found' , message:'O cartão deve existir para poder ser ativado '}
    }

    const isAlreadyActive = card.password;
    if(!isAlreadyActive){
        throw {type:"bad_request" ,message:"cartão não esta ativado"}
    }

    const today = dayjs().format("MM/YY");
    if (dayjs(today).isAfter(dayjs(card.expirationDate))){
        throw {type : "bad_request" , message:"cartão já expirou"} 
    } 

    const isPasswordValid = bcrypt.compareSync(password, isAlreadyActive) // não pegou card.password
    if(!isPasswordValid){
        throw {type:"unauthorized", message:"senha informada não bate com a do user"}
    }

    const businessExist = await businessRepository.findById(businessId)
    if(!businessExist){
        throw {type:'not found' , message:"Empresa não ta cadastrada" }
    }

    if(card.isBlocked===true){
        throw {type:'conflit' , message:"Cartão está bloqueado para compras" }
    }


    const payments = await paymentRepository.findByCardId(id)
    const recharges = await rechargeRepository.findByCardId(id)
    

    const totalPaymentsAmount = payments.reduce((amount, transaction)=>{
        return amount + transaction.amount
    }, 0);

    const totalRechargeAmount= recharges.reduce((amount, transaction)=>{
        return amount + transaction.amount
    }, 0);

    const cardAmount = totalRechargeAmount-totalPaymentsAmount

    if(cardAmount<amount){
        throw {type:"bad_request" , message:"Não tem saldo suficiente para realizar a compra "}
    }

    if(card.type!= businessExist.type){
        throw {type: "bad_request" , message:"tipo de loja é diferente do cartao"}
    }

    
    
    await paymentRepository.insert({cardId:id, businessId, amount})

}

export async function transactions(id:number, employeeId:number) {

    const card = await cardRepository.findById(id)
    if(!card){
        throw {type:'not found' , message:'O cartão deve existir para poder ser ativado '}
    }

    if(card.employeeId !== employeeId){
        throw {
            type: "unauthorized",
            message: "unauthorized userrr"
        }
    }

   
    const recharges = await rechargeRepository.findByCardId(id);
    let rechargeValues = 0;
    if(recharges.length > 0){
        recharges.map((recharge) => rechargeValues += recharge.amount);
    }

    
    const purchases = await paymentRepository.findByCardId(id);
    let purchaseValues = 0;
    if(purchases.length > 0){
        purchases.map((purchase) => purchaseValues += purchase.amount);
    }

    const total = rechargeValues - purchaseValues;
    const transactionsData = {
        total,
        "transactions": purchases,
        "recharges": recharges
    }

    return transactionsData;

}

export async function statusCard(id:number, setStatus:string , employeeId:number , password:string){

   
    
    const card = await cardRepository.findById(id)
    if(!card){
        throw {type:'not found' , message:'O cartão deve existir para poder ser ativado '}
    }

    if(card.employeeId !== employeeId){
        throw { type: "unauthorized",message: "Usuario não é o dono do cartão"}
    }
    
    const isAlreadyActive = card.password;
    if(!isAlreadyActive){
        throw {type:"bad_request" ,message:"cartão não esta ativado"}
    }

    const today = dayjs().format("MM/YY");
    if (dayjs(today).isAfter(dayjs(card.expirationDate))){
        throw {type : "bad_request" , message:"cartão já expirou"} 
    } 

    const isPasswordValid = bcrypt.compareSync(password, isAlreadyActive) // não pegou card.password
    if(!isPasswordValid){
        throw {type:"unauthorized", message:"senha informada não bate com a do user"}
    }

    if(setStatus==="block" && card.isBlocked===true){
        throw {type:"bad_request", message:"cartão já ta bloqueado"}
    }

    if(setStatus==="unblock" && card.isBlocked===false){
        throw {type:"bad_request", message:"cartão já ta desbloqueado"}
    }

    if(setStatus==="block" && card.isBlocked===false){
        await cardRepository.update(id ,{isBlocked:true})
    }

    if(setStatus==="unblock" && card.isBlocked===true){
        await cardRepository.update(id ,{isBlocked:false})
    }
}