import joi from "joi" ;

const activateCardSchema = joi.object ({
  cvc : joi.string().required(),
  password : joi.string().required()
}) 

export default activateCardSchema ;