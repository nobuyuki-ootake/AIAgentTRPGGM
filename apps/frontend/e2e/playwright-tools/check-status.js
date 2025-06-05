import http from 'http';

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Request timeout')));
    });
}

async function checkAppStatus() {
    console.log('🔍 Checking TRPG Application Status...\n');
    
    const testUrls = [
        'http://localhost:5173',
        'http://localhost:5173/trpg-session',
        'http://localhost:5173/characters',
        'http://localhost:5173/world-building',
        'http://localhost:5173/timeline',
        'http://localhost:5173/plot',
        'http://localhost:5173/writing'
    ];
    
    for (const url of testUrls) {
        try {
            console.log(`Testing: ${url}`);
            const response = await httpGet(url);
            
            if (response.status === 200) {
                const content = response.data;
                console.log(`✅ Status ${response.status} - Content length: ${content.length} characters`);
                
                // Check for common error indicators in the HTML
                if (content.includes('Cannot resolve module') || 
                    content.includes('Failed to fetch') ||
                    content.includes('Module not found') ||
                    content.includes('Error:')) {
                    console.log('⚠️  Potential errors detected in content');
                    
                    // Show a snippet of the error
                    const errorMatch = content.match(/(Cannot resolve module|Failed to fetch|Module not found|Error:)[^\n]{0,100}/);
                    if (errorMatch) {
                        console.log(`   Error snippet: ${errorMatch[0]}`);
                    }
                }
                
                // Check if it's the main HTML (vs API response)
                if (content.includes('<div id="root"') && content.includes('main.tsx')) {
                    console.log('✅ Main React app HTML detected');
                } else if (content.length < 100) {
                    console.log('⚠️  Very short response, might be an error');
                    console.log(`   Content: ${content}`);
                }
                
            } else {
                console.log(`❌ Status ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        console.log('');
    }
    
    // Check the main.tsx file that's referenced in the HTML
    try {
        console.log('Checking main.tsx module...');
        const mainTsxResponse = await httpGet('http://localhost:5173/src/main.tsx');
        if (mainTsxResponse.status === 200) {
            const mainContent = mainTsxResponse.data;
            console.log(`✅ main.tsx loaded - Content length: ${mainContent.length} characters`);
            
            // Check for import errors
            if (mainContent.includes('Timeline')) {
                console.log('✅ Timeline import found in main.tsx');
            }
            
            // Look for other imports
            const imports = mainContent.match(/import .+ from ['"'][^'"]+['"]/g);
            if (imports) {
                console.log(`Found ${imports.length} import statements`);
            }
        } else {
            console.log(`❌ main.tsx returned status: ${mainTsxResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ Error loading main.tsx: ${error.message}`);
    }
}

// Install node-fetch if not available
try {
    await checkAppStatus();
} catch (error) {
    if (error.message.includes('fetch')) {
        console.log('❌ node-fetch not available. Installing...');
        console.log('Please run: npm install node-fetch');
        
        // Fallback to basic HTTP check
        const http = await import('http');
        const req = http.get('http://localhost:5173', (res) => {
            console.log(`Basic HTTP check: Status ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('✅ Server is responding');
            } else {
                console.log('❌ Server returned error status');
            }
        });
        
        req.on('error', (err) => {
            console.log(`❌ Connection error: ${err.message}`);
        });
    } else {
        console.error('Error:', error.message);
    }
}