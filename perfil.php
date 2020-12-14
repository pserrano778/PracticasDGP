<?php
    require_once '../vendor/autoload.php';
    include_once("php/listasVinculaciones.php");
    include_once("guardarImagen.php");
    require_once 'php/mostrarFotoPerfil.php';

    $loader = new \Twig\Loader\FilesystemLoader('templates');
    $twig = new \Twig\Environment($loader);

    session_start();
    $aCargo = false;

    if(isset($_SESSION['usuario'])) $rol = $_SESSION['rol'];
    else $rol = "";

    if (isset($_GET['username'])) {
        $idUsuario = $_GET['username'];
        //$_SESSION['username'] = $idUsuario;

        $infoPerfil = array();
        $listadoTareasAsignadasSocio = array();
        $infoChat = "";
        $infoPerfil['username'] = $idUsuario;

        $jsonInfoPerfil = json_encode($infoPerfil);

        $result = infoPerfilApi($jsonInfoPerfil);

        $infoUsuario = array();
        $listadoSocios = array();
        $listadoFacilitadores = array();
        $preferencias = array();

        foreach($result as $item){
            $infoUsuario['nombre'] = $item->nombre;
            $infoUsuario['username'] = $item->username;
            $infoUsuario['rol'] = $item->rol;
            getImage($item->imagenPerfil);
            $img = "img/".$item->imagenPerfil;
            
            if($infoUsuario['rol'] == "admin" || $infoUsuario['rol'] == "ambos" || $infoUsuario['rol'] == "facilitador"){
                $infoUsuario['mote'] = $item->mote;
                $infoUsuario['direccion'] = $item->direccion;
                $infoUsuario['telefono'] = $item->telefono;

                $infoSociosVinculados = array();
                $infoSociosVinculados['user_facilitador'] = $infoUsuario['username'] ;
                $jsonInfoSociosVinculados = json_encode($infoSociosVinculados);

                $listadoSocios = listadoSociosVinculados($jsonInfoSociosVinculados);
            }
            else{
                $facilitadores = $item->facilitadoresACargo;
                foreach( $facilitadores as $facilitador){
                    $infoFacilitador = array();
                    $infoFacilitador['username'] = $facilitador;
                    if ($facilitador == $_SESSION['usuario']){
                        $aCargo = true;
                    }
                    $jsonInfoFacilitador = json_encode($infoFacilitador);
                    $result = infoPerfilApi($jsonInfoFacilitador);
                    array_push($listadoFacilitadores,$result[0]);
                }
                if(isset($item->preferenciaAudio)){
                    /*Preferencias*/
                    $preferencias['audio'] = $item->preferenciaAudio ? "Si" : "No" ;
                    $preferencias['video'] = $item->preferenciaVideo ? "Si" : "No" ;
                    $preferencias['texto'] = $item->preferenciaTexto ? "Si" : "No" ;
                }
                else{
                    $preferencias['audio'] = "No" ;
                    $preferencias['video'] = "No" ;
                    $preferencias['texto'] = "No" ;
                }

                /*Tareas enviadas*/
                $infoTareasAsignadasSocio = array();
                $infoTareasAsignadasSocio['creador'] = $_SESSION['usuario'] ;
                $infoTareasAsignadasSocio['socioAsignado'] = $infoUsuario['username'];
                $jsonInfoTareasAsignadasSocio = json_encode($infoTareasAsignadasSocio);
                $listadoTareasAsignadasSocio = json_decode(tareasEnviadasSocioApi($jsonInfoTareasAsignadasSocio));

                if($aCargo){
                    $infoChat = array();
                    $idFacilitador = array();
                    $idFacilitador['username'] = $_SESSION['usuario'];
                    $jsonIdFacilitador = json_encode($idFacilitador);
                    $infoFacilitador = obtenerInfoUsuariosApi($jsonIdFacilitador);
                    $moteFacilitador = $infoFacilitador[0]->mote;
                    $infoChat['mote'] = $moteFacilitador;
                    $infoMD = array();
                    $infoMD['facilitador'] = $_SESSION['usuario'];
                    $infoMD['socio'] = $infoUsuario['username'];
                    $jsonInfoMD = json_encode($infoMD);
                    $infoMD = infoMDApi($jsonInfoMD);
                    $infoMD = json_decode($infoMD);
                    $infoChat['idChat'] = $infoMD[0]->idChat;
                    $infoChat['nombreChat'] = $infoMD[0]->nombreChat;
                    $infoChat['socio'] = $infoUsuario['username'];

                    $resultadoVision = vistoMDApi($jsonInfoMD);
                }
            }
    }
    } else{
        $idUsuario = -1;
    }

    

    echo $twig->render('perfil.html', ['id' => $idUsuario, 'infoUsuario' => $infoUsuario, 'rol' => $rol, 'sociosacargo' => $listadoSocios, 'facilitadores' => $listadoFacilitadores, 'preferencias' => $preferencias, 'imagen' => $img , 'img' => fotoPerfil($_SESSION['usuario']), 'cuenta' => $_SESSION['usuario'] , 'tareasAsignadas' => $listadoTareasAsignadasSocio, 'infoChat' => $infoChat, 'aCargo' => $aCargo ]);
?>
