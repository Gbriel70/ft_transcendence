## frontend preview (without backend)

cd ./app/frontend & python3 -m http.server 8000

Open http://localhost:8000 in your browser to see the frontend preview.

To preview the dashboard page:

Open your browser to http://localhost:8080

Open the browser console (F12) and run this to mock authentication:

```javascript
localStorage.setItem('token', 'mock-token-123');
localStorage.setItem('user', JSON.stringify({
	id: 1,
		name: 'Finn Mertens',
		email: 'finn@ooo.com',
		profile_picture: 'https://scontent.fcgh22-1.fna.fbcdn.net/v/t39.30808-6/305995090_632122068484799_8586342781366237259_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeFXBAcoqSE1RbsqBo-xaLWgbKWEyd41_9dspYTJ3jX_1zigRZBklxtWxQeHHcaxKRoasouRyf7Tlo4owK29I0WS&_nc_ohc=-jlKJmFwdh0Q7kNvwEU5JXV&_nc_oc=AdmTnGzhUgONUI0QZAmmVAQi8hubZ1Zh5vXspL0nlLRYDjWPDxZCUEOhBRx0TVHQ26Aez6mE-6M9C3hfT9p8mHe6&_nc_zt=23&_nc_ht=scontent.fcgh22-1.fna&_nc_gid=X4XDaAFfP67XCZUIEG7hhQ&_nc_ss=8&oh=00_AfsaYbS8YSdQ_mZtvul-iDQ66yqejG7p924GdN5lkc6pvg&oe=69A95CF8'
	}));
```

## Mock Data Function

Use this function to easily change balance, income, expenses, and transactions:

```javascript
function updateMockData(balance = 12450.00, income = 3200.00, expenses = 1580.00, transactions = null) {
    // If no transactions provided, generate mock data
    if (!transactions) {
        transactions = [
            {
                id: 1,
                recipient_email: 'maria.silva@example.com',
                amount: 1200.00,
                status: 'completed',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                recipient_email: 'joao.santos@example.com',
                amount: -350.00,
                status: 'completed',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                recipient_email: 'lucas.oliveira@example.com',
                amount: 2000.00,
                status: 'completed',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 4,
                recipient_email: 'ana.costa@example.com',
                amount: -780.00,
                status: 'pending',
                created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 5,
                recipient_email: 'pedro.lima@example.com',
                amount: -450.00,
                status: 'failed',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    // Store the data in localStorage
    const mockData = {
        balance: balance,
        income: income,
        expenses: expenses,
        transactions: transactions
    };

    localStorage.setItem('mockData', JSON.stringify(mockData));
    console.log('✅ Mock data updated:', mockData);

    // Reload the page to see changes
    console.log('🔄 Reloading page...');
    window.location.reload();
}
```

### Example Usage:

```javascript
// Use default values (balance: 12450, income: 3200, expenses: 1580)
updateMockData();

// Custom balance only
updateMockData(5000.00);

// Custom balance and income/expenses
updateMockData(10000.00, 5000.00, 2000.00);

// High balance scenario
updateMockData(50000.00, 15000.00, 5000.00);

// Low balance scenario
updateMockData(100.50, 500.00, 1200.00);

// Custom transactions
updateMockData(8000.00, 4000.00, 1500.00, [
    { id: 1, recipient_email: 'salary@company.com', amount: 5000.00, status: 'completed', created_at: new Date().toISOString() },
    { id: 2, recipient_email: 'rent@apartment.com', amount: -1200.00, status: 'completed', created_at: new Date().toISOString() }
]);
```

### Clear Mock Data:

```javascript
localStorage.removeItem('mockData');
window.location.reload();
```
```
