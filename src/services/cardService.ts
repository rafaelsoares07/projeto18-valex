import { findByApiKey } from "../repositories/companyRepository";
import { findById } from "../repositories/employeeRepository";
import { findByTypeAndEmployeeId } from "../repositories/cardRepository";


import { faker } from '@faker-js/faker';

export async function create(
    apiKey: string,
    employeeId: number,
    type: "groceries"| "restaurant"| "transport"| "education"| "health" //podemos fazer isso no typescript 
) {
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

    const cardCVV = faker.finance.creditCardCVV()

    //Destruturacao de array com spread operator [ , , c] = ["morango", "banana", "cenoura"] -> pegaria só cenoura
    const [firstName, ...outherNames] = employee.fullName.split(" ")
    const namesValid = outherNames.filter((el)=> el.length>3)
    const lastName = namesValid[namesValid.length-1] // namesValid.pop()
    


}