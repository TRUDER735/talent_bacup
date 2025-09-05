require('dotenv').config();

async function testEmailConfig() {
    console.log('🔧 Testing Resend HTTP API...\n');
    
    // Check environment variables
    const config = {
        RE_SEND_PASS: process.env.RE_SEND_PASS,
        EMAIL_FROM: process.env.EMAIL_FROM
    };
    
    console.log('📋 Environment Variables:');
    console.log(`RE_SEND_PASS: ${config.RE_SEND_PASS ? '✅ set' : '❌ missing'} (length: ${config.RE_SEND_PASS?.length || 0})`);
    console.log(`EMAIL_FROM: ${config.EMAIL_FROM ? '✅ set' : '❌ missing'} (${config.EMAIL_FROM || 'undefined'})`);
    
    // Check for missing required config
    const missing = [];
    if (!config.RE_SEND_PASS) missing.push('RE_SEND_PASS');
    if (!config.EMAIL_FROM) missing.push('EMAIL_FROM');
    
    if (missing.length > 0) {
        console.log(`\n❌ Missing required config: ${missing.join(', ')}`);
        return;
    }
    
    try {
        // Test Resend API connection
        console.log('\n🔍 Testing Resend API connection...');
        const testResponse = await fetch('https://api.resend.com/domains', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.RE_SEND_PASS}`,
                'Content-Type': 'application/json',
            },
        });

        if (!testResponse.ok) {
            throw new Error(`Resend API test failed: ${testResponse.status} ${testResponse.statusText}`);
        }
        
        console.log('✅ Resend API connection verified successfully');
        
        // Test sending email
        console.log('\n📧 Testing email send via Resend API...');
        const testOTP = '123456';
        
        const emailData = {
            from: config.EMAIL_FROM,
            to: [config.EMAIL_FROM], // Send to self for testing
            subject: 'Test OTP Email - HTTP API Debug',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Test OTP Email (HTTP API)</h2>
                    <p>This is a test email using Resend HTTP API instead of SMTP.</p>
                    <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0;">${testOTP}</h1>
                    </div>
                    <p>If you receive this email, the HTTP API email service is working correctly.</p>
                </div>
            `,
        };
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.RE_SEND_PASS}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ Test email sent successfully via HTTP API!`);
        console.log(`📧 Email ID: ${result.id}`);
        console.log(`📧 Response:`, result);
        
    } catch (error) {
        console.log('❌ Email test failed:');
        console.log(`Error: ${error.message}`);
        console.log('\nFull error:', error);
    }
}

testEmailConfig().catch(console.error);
