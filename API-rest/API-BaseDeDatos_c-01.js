require('dotenv').config();

const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = process.env.MONGO_CONNECTION_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
// var jsonParser = BodyParser.json();

var database, collectionUsuarios, collectionGrupos;

app.listen(5000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collectionUsuarios = database.collection("Usuarios");
        collectionTareas = database.collection("Tareas");
        collectionGrupos = database.collection("Grupos");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

/******************************************************/
// Registro Usuarios
/******************************************************/
app.post("/registro", (request, response) => {
    collectionUsuarios.insertOne(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null){
            response.send("Registro incorrecto");
        }
        else{    
            response.send("Registro completado");
        }
    });
});

/******************************************************/
// Login Usuarios
/******************************************************/
app.post("/login", (request, response) => {

    collectionUsuarios.findOne({ "username":request.body.username }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null){
            response.send("Nombre de usuario incorrecto");
        }
        else{
            collectionUsuarios.findOne({ "username":request.body.username,"password":request.body.passwd }, (errorPass, resultPass) => {
                if(errorPass) {
                    return response.status(500).send(errorPass);
                }
                if (resultPass == null){
                    response.send("Contraseña incorrecta");
                }
                else{
                    response.send(result.rol); //Si ha iniciado sesión correctamente, se le responde con su rol
                }
            }
        );
        }
    });
});

/******************************************************/
// Login Socios
/******************************************************/
app.post("/login-socio", (request, response) => {

    collectionUsuarios.findOne({ "rol" : "socio", "username":request.body.username }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null) { //Comprobación adicional que nunca debe fallar (la comprobación del usuario se realiza en pasos anteriores)
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":2}'); //Fallo del usuario
            response.send(jsonRespuestaIncorrecta);
        }
        else{
            collectionUsuarios.findOne({ "rol" : "socio", "username":request.body.username,"password":request.body.passwd }, (errorPass, resultPass) => {

                if(errorPass) {
                    return response.status(500).send(errorPass);
                }
                if (resultPass == null){
                    var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}'); //Fallo de la contraseña
                    response.send(jsonRespuestaIncorrecta);
                }
                else{
                    var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
                    response.send(jsonRespuestaCorrecta); //Exito en login
                }
            }
        );
        }
    });
});

/******************************************************/
// Listado administradores
/******************************************************/
app.get("/listado-administradores", (request, response) => {
    collectionUsuarios.find({"rol":{"$in": ["admin","ambos"]}}).toArray(function (error, result){
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay administradores");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado facilitadores
/******************************************************/
app.get("/listado-facilitadores", (request, response) => {
    collectionUsuarios.find({ "rol": { "$in": ["facilitador", "ambos"] } }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay facilitadores");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado socios
/******************************************************/
app.get("/listado-socios", (request, response) => {
    collectionUsuarios.find({ "rol": "socio" }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay socios");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Crear tarea
/******************************************************/
app.post("/crear-tarea", (request, response) => {
    collectionTareas.insertOne(request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en la creación");
        }
        else {
            response.send("Creación completada");
        }
    });
});

/******************************************************/
// Eliminar tarea
/******************************************************/
app.post("/eliminar-tarea", (request, response) => {
    collectionTareas.deleteOne({ "creador": request.body.username, "nombre":request.body.nombreTarea }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Listado tareas (La funcionalidad ahora mismo es un "mis tareas" de facilitador)
/******************************************************/
app.post("/listado-tareas", (request, response) => {
    collectionTareas.find({ "creador": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no has creado tareas!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Mis socios
/******************************************************/
app.post("/mis-socios", (request, response) => {
    collectionUsuarios.find({ "username": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no tienes socios a cargo!");
        }
        else {
            response.send(result);
        }
    });
});
/******************************************************/
// Perfil
/******************************************************/
app.post("/perfil", (request, response) => {
    collectionUsuarios.find({ "username":request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Perfil no encontrado");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Existe usuario
/******************************************************/
app.get("/existe-usuario", (request, response) => {
    collectionUsuarios.find({ "rol" : "socio", "username":request.query.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == "") {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Eliminar usuario
/******************************************************/
app.post("/eliminar-usuario", (request, response) => {
    collectionUsuarios.deleteOne({ "username":request.body.username }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Socios vinculados
/******************************************************/
app.post("/socios-vinculados", (request, response) => {
    collectionUsuarios.find({ "username": request.body.user_facilitador }, {"_id": 0, "sociosACargo": 1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el array");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Socios no vinculados
/******************************************************/
app.post("/socios-no-vinculados", (request, response) => {
    collectionUsuarios.find({ "rol": "socio", "facilitadoresACargo": { "$not": { "$eq" : request.body.user_facilitador} } }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el array");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Info usuario
/******************************************************/
app.post("/info-usuario", (request, response) => {
    collectionUsuarios.find({ "username": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el usuario");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Facilitadores a cargo
/******************************************************/
app.post("/facilitadores-a-cargo", (request, response) => {
    collectionUsuarios.find({ "username": request.body.user_socio }, {"_id": 0, "facilitadoresACargo": 1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el array");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Vincular socio a facilitador
/******************************************************/
app.post("/vincular-socio-facilitador", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_facilitador }, {"$push": {"sociosACargo": request.body.user_socio} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Vincular facilitador a socio
/******************************************************/
app.post("/vincular-facilitador-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_socio }, {"$push": {"facilitadoresACargo": request.body.user_facilitador} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el facilitador");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Desvincular socio con facilitador
/******************************************************/
app.post("/desvincular-socio-facilitador", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_facilitador }, {"$pull": {"sociosACargo": request.body.user_socio} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Desvincular facilitador con socio
/******************************************************/
app.post("/desvincular-facilitador-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_socio }, {"$pull": {"facilitadoresACargo": request.body.user_facilitador} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Crear grupo
/******************************************************/
app.post("/crear-grupo", (request, response) => {
    collectionGrupos.insertOne(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null){
            response.send("Fallo en la creación");
        }
        else{    
            response.send("Creación completada");
        }
    });
});

/******************************************************/
// Eliminar grupo
/******************************************************/
app.post("/eliminar-grupo", (request, response) => {
    collectionGrupos.deleteOne({ "nombre": request.body.nombreGrupo, "facilitadorACargo": request.body.username }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Mis grupos
/******************************************************/
app.post("/mis-grupos", (request, response) => {
    collectionGrupos.find({ "facilitadorACargo": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no has creado grupos!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Info grupos
/******************************************************/
app.post("/info-grupo", (request, response) => {
    collectionGrupos.find({ "nombre": request.body.nombreGrupo, "facilitadorACargo": request.body.facilitadorACargo }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el grupo");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado grupos
/******************************************************/
app.get("/listado-grupos", (request, response) => {
    collectionGrupos.find({ }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no has creado grupos!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Eliminar grupo
/******************************************************/
app.post("/eliminar-grupo", (request, response) => {
    collectionGrupos.removeOne({ "nombre": request.body.nombre_grupo, "facilitadorACargo": request.body.nombre_facilitador }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Este grupo no existe o no se puede eliminar");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Añadir preferencias usuario
/******************************************************/
app.post("/add-preferencias", (request, response) => {

    var texto = (request.body.texto === "true"); 
    var audio = (request.body.audio === "true");
    var video = (request.body.video === "true");

    collectionUsuarios.updateOne( {$and: [ {"username":request.body.username },  {"rol":"socio" }] },{$set: {"preferenciaTexto":texto, "preferenciaAudio":audio, "preferenciaVideo":video}}, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaIncorrecta);
        }
    });
});

/******************************************************/
// Obtener preferencias usuario
/******************************************************/
// 
app.get("/preferencias-usuario", (request, response) => {
    collectionUsuarios.find({ "rol" : "socio", "username":request.query.username}, {projection: {_id:0 , preferenciaTexto: 1, preferenciaAudio: 1, preferenciaVideo: 1}}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else if (result[0].preferenciaTexto == null || result[0].preferenciaAudio == null || result[0].preferenciaVideo == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            response.send(result[0]);
        }
    });
});

/**/
// Edición Usuarios
/**/
app.post("/editarUsuario", (request, response) => {
    collectionUsuarios.replaceOne({ "username": request.body.oldUsername }, request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Registro incorrecto");
        }
        else {
            response.send("Registro completado");
        }
    });
});

/**/
// Añadir socio a grupo
/**/
app.post("/anadir-socio-grupo", (request, response) => {
    collectionGrupo.updateOne({ "nombre": request.body.nombre_grupo, "facilitadorACargo" : request.body.facilitadorACargo }, { "$push": { "socios": request.body.user_socio } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el facilitador");
        }
        else {
            response.send(result);
        }
    });
});

/**/
// Añadir grupo a grupos de un socio.
/**/
app.post("/anadir-grupo-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username": request.body.user_socio}, { "$push": { "grupos": request.body.nombre_grupo } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el facilitador");
        }
        else {
            response.send(result);
        }
    });
});

/**/
// Eliminar a socio de grupo
/**/
app.post("/eliminar-socio-grupo", (request, response) => {
    collectionGrupos.updateOne({ "nombre": request.body.nombre_grupo }, { "$pull": { "socios": request.body.user_socio } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el grupo o el usuario");
        }
        else {
            response.send(result);
        }
    });
});

/**/
// Desvincular facilitador con socio
/**/
app.post("/eliminar-grupo-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username": request.body.user_socio }, { "$pull": { "grupos": request.body.nombre_grupo } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio o el grupo");
        }
        else {
            response.send(result);
        }
    });
});