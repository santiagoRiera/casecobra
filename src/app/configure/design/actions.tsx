"use server"

import { db } from "@/db";
import { CaseColor, CaseFinish, CaseMaterial, PhoneModel } from "@prisma/client";

export type SaveConfigArgs = {
    color: CaseColor, 
    finish: CaseFinish, 
    material: CaseMaterial, 
    model: PhoneModel, 
    configId: string
}

//Uso de patron RPC: remote procedure call. Llamamos a una funcion y no usamos URL parameters, o a post request body
export async function saveConfig({color, finish, material, model, configId}: SaveConfigArgs){
    await db.configuration.update({
        where: {id: configId},
        data: {color, finish, material, model}
    })
}