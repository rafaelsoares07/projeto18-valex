import { findByApiKey } from "../repositories/companyRepository";
import { findById } from "../repositories/employeeRepository";
import { findByTypeAndEmployeeId , insert} from "../repositories/cardRepository";
import * as cardRepository from "../repositories/cardRepository";
import * as rechargeRepository from "../repositories/rechargeRepository"


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
}

export async function active(id:number , cvc:string, password:string){

    const card = await cardRepository.findById(id)
    if(!card){
        throw {type:'NotFound' , message:'O cartão deve existir para poder ser ativado '}
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
        throw {type:'NotFound' , message:'O cartão deve existir para poder ser ativado '}
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