const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.updateUser = async (event) => {
    let response;

    try {
        // Parsear el cuerpo de la solicitud
        const { email, nombre, apellido, fechaNacimiento, celular, usuario, contraseña } = JSON.parse(event.body);

        if (!email) {
            throw new Error("El campo email es obligatorio para identificar al usuario");
        }

        // Primero, buscar el ID del usuario utilizando el índice secundario global (GSI) email
        const getIdParams = {
            TableName: "Cliente",
            IndexName: "EmailIndex", // Asegúrate de que este sea el nombre correcto del índice
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            },
            ProjectionExpression: "id" // Obtener solo el ID
        };

        const idResult = await dynamodb.query(getIdParams).promise();

        if (idResult.Items.length === 0) {
            throw new Error("No se encontró un usuario con el email proporcionado");
        }

        const userId = idResult.Items[0].id;

        // Configurar los parámetros para la actualización
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (nombre) {
            updateExpression.push("#nombre = :nombre");
            expressionAttributeNames["#nombre"] = "nombre";
            expressionAttributeValues[":nombre"] = nombre;
        }
        if (apellido) {
            updateExpression.push("#apellido = :apellido");
            expressionAttributeNames["#apellido"] = "apellido";
            expressionAttributeValues[":apellido"] = apellido;
        }
        if (fechaNacimiento) {
            updateExpression.push("#fechaNacimiento = :fechaNacimiento");
            expressionAttributeNames["#fechaNacimiento"] = "fechaNacimiento";
            expressionAttributeValues[":fechaNacimiento"] = fechaNacimiento;
        }
        if (celular) {
            updateExpression.push("#celular = :celular");
            expressionAttributeNames["#celular"] = "celular";
            expressionAttributeValues[":celular"] = celular;
        }
        if (usuario) {
            updateExpression.push("#usuario = :usuario");
            expressionAttributeNames["#usuario"] = "usuario";
            expressionAttributeValues[":usuario"] = usuario;
        }
        if (contraseña) {
            updateExpression.push("#contraseña = :contraseña");
            expressionAttributeNames["#contraseña"] = "contraseña";
            expressionAttributeValues[":contraseña"] = contraseña;
        }

        if (updateExpression.length === 0) {
            throw new Error("No se proporcionaron campos para actualizar");
        }

        const params = {
            TableName: "Cliente",
            Key: {
                "id": userId
            },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "UPDATED_NEW"
        };

        // Ejecutar la actualización
        const result = await dynamodb.update(params).promise();

        // Respuesta exitosa
        response = {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                statusDesc: "Usuario actualizado exitosamente",
                statusCode: 200,
                updatedAttributes: result.Attributes
            }),
        };

    } catch (error) {
        console.error("Error al actualizar el usuario:", error);

        // Manejo de errores
        let errorMessage = "Error interno del servidor";
        let errorDescription = error.message;
        let statusCode = 500;

        if (error.message === "El campo email es obligatorio para identificar al usuario" || error.message === "No se encontró un usuario con el email proporcionado" || error.message === "No se proporcionaron campos para actualizar") {
            errorMessage = error.message;
            statusCode = 400;
        }

        response = {
            statusCode,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                statusDesc: errorMessage,
                statusMessage: errorDescription,
                statusCode,
            }),
        };
    }

    return response;
};
