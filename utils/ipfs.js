const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Upload data to IPFS (using Pinata as an example)
// exports.uploadToIPFS = async (data) => {
//   try {
//     // Convert data to JSON file
//     const tempDir = path.join(__dirname, '..', 'temp');
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir);
//     }
    
//     const filePath = path.join(tempDir, `emergency_${data.userId}_${Date.now()}.json`);
//     fs.writeFileSync(filePath, JSON.stringify(data));
    
//     // Prepare form data
//     const formData = new FormData();
//     formData.append('file', fs.createReadStream(filePath));
    
//     // Upload to IPFS via Pinata
//     const response = await axios.post(
//       'https://api.pinata.cloud/pinning/pinFileToIPFS',
//       formData,
//       {
//         headers: {
//           'pinata_api_key': process.env.PINATA_API_KEY,
//           'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
//           ...formData.getHeaders()
//         },
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity
//       }
//     );
    
//     // Clean up temp file
//     fs.unlinkSync(filePath);
    
//     return response.data.IpfsHash;
//   } catch (err) {
//     console.error('IPFS upload error:', err);
//     throw err;
//   }
// };


exports.uploadToIPFS = async (data) => {
  console.log('🧾 [IPFS] Preparing data for IPFS upload...');
  try {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
      console.log('📁 [IPFS] Temp directory created.');
    }

    const filePath = path.join(tempDir, `emergency_${data.userId}_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('📁 [IPFS] Data written to file:', filePath);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    console.log('🌐 [IPFS] Sending file to Pinata...');
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    fs.unlinkSync(filePath);
    console.log('🧹 [IPFS] Temp file cleaned up.');

    return response.data.IpfsHash;
  } catch (err) {
    console.error('❌ [IPFS] Upload failed:', err.message);
    throw err;
  }
};
