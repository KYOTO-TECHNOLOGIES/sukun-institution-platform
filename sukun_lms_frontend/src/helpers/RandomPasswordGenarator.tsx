

     // Function to generate random password that meets validation requirements
     const generateRandomPassword = () => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
     
        const allChars = lowercase + uppercase + numbers ;
        
        let password = '';
        
        // Ensure at least one character from each required category
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
       
        
        // Fill the rest with random characters to make it 12 characters long
        for (let i = 4; i < 12; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password to make it more random
        return password.split('').sort(() => Math.random() - 0.5).join('');
    };
 


export default generateRandomPassword