// Configuración centralizada para AWS
// Esta variable detecta automáticamente si estás en localhost o en S3/CloudFront
const currentOrigin = window.location.origin;

const CONFIG = {
    // --- AWS EC2 / API GATEWAY CONFIGURATION ---
    // Cambia esta URL si usas una nueva instancia EC2, un Application Load Balancer o un API Gateway.
    API_URL: 'https://52.200.111.100.nip.io', 
    
    // --- AWS COGNITO CONFIGURATION ---
    // Si creas un nuevo grupo de usuarios (User Pool) en Cognito, debes actualizar estas 4 variables:
    COGNITO_REGION: 'us-east-1', // Región de AWS (ej: us-east-1, us-west-2)
    COGNITO_USER_POOL_ID: 'us-east-1_gXHISpjx9', // ID del nuevo User Pool en Cognito
    COGNITO_CLIENT_ID: '6bnufkn09clee3f90m1uo38ev2', // ID del cliente de la aplicación (App Client ID)
    COGNITO_DOMAIN: 'https://us-east-1gxhispjx9.auth.us-east-1.amazoncognito.com', // Dominio configurado en Cognito

    // --- AL SUBIR A S3 / CLOUDFRONT ---
    // El frontend detectará solo la URL, pero TÚ DEBES ir a la consola de AWS Cognito y agregar
    // LA URL EXACTA de tu CloudFront (ej: https://d12345.cloudfront.net/index.html) a la lista de:
    // 1. "Orígenes de devolución de llamada permitidos" (Allowed callback URLs)
    // 2. "Orígenes de cierre de sesión permitidos" (Allowed sign-out URLs)
    COGNITO_REDIRECT_URI: `${currentOrigin}/index.html`,
    COGNITO_LOGOUT_URI: `${currentOrigin}/index.html`,
    
    COGNITO_SCOPES: 'email openid profile',
    //IS_LOCAL: currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
};
export default CONFIG;
