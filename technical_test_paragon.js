describe('E2E Member Registration & Shopping Flow', () => {
  beforeEach(() => {
    cy.visit('https://recruitment-staging-queenbee.paradev.io/');
  });

  it('E2E_001 - Register as a member', () => {
    cy.contains('Daftar Jadi member').should('exist').click();
    cy.contains('Tidak, saya tidak memiliki kode Referral').should('exist').click();
    cy.contains('Lanjut').should('exist').click();
    
    cy.url().should('include', '/register').then((url) => {
      expect(url).to.be.equal('https://recruitment-staging-queenbee.paradev.io/register');
    });

    // Verify form is initially not visible
    cy.get('input[name="name"]').should('not.exist');

    cy.contains('Tidak, saya tidak memiliki kode Referral').click();
    
    // Ensure form fields are visible
    cy.get('input[name="name"]').should('be.visible'); 
    cy.get('input[name="phone"]').should('be.visible'); 
    cy.get('input[name="email"]').should('be.visible'); 
    cy.get('input[name="password"]').should('be.visible'); 

    cy.url().should('include', '/register').then((url) => {
      expect(url).to.be.equal('https://recruitment-staging-queenbee.paradev.io/register');
    });
  });

  it('E2E_002 - Fill out registration form', () => {
    cy.contains('Daftar').should('exist').and('be.disabled');

    cy.get('input[name="name"]').should('exist').type('rahmi');
    cy.get('input[name="phone"]').should('exist').type('+62 12345678');
    cy.get('input[name="email"]').should('exist').type('test@example.com');
    cy.get('input[name="password"]').should('exist').type('T3st!n9@');

    cy.contains('Daftar').should('not.be.disabled');

    cy.contains('Daftar').click();

    cy.contains('Whatsapp').should('be.visible').then(($el) => {
      expect($el.text()).to.include('Whatsapp');
    });
  });

  it('E2E_003 - WhatsApp Verification Modal', () => {
    cy.contains('Daftar').should('exist').and('be.disabled');

    cy.get('input[name="name"]').type('rahmi');
    cy.get('input[name="phone"]').type('+62 12345678');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('T3st!n9@');

    cy.contains('Daftar').should('not.be.disabled').click();

    cy.contains('Whatsapp').should('be.visible').click();

    cy.contains('Masukkan Kode Verifikasi').should('be.visible').then(($el) => {
      expect($el.text()).to.include('Masukkan Kode Verifikasi');
    });
  });

  it('E2E_004 - Input WhatsApp Verification Code', () => {
    cy.get('input[name="name"]').type('rahmi');
    cy.get('input[name="phone"]').type('+62 12345678');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('T3st!n9@');

    cy.contains('Daftar').should('not.be.disabled').click();

    cy.contains('Whatsapp').should('be.visible').click();

    cy.contains('Masukkan Kode Verifikasi').should('be.visible');

    cy.contains('Kirim').should('be.disabled');

    // Enter incorrect OTP
    const incorrectOTP = '123450';
    incorrectOTP.split('').forEach((num, index) => {
      cy.get(`input[data-index="${index}"]`).should('exist').type(num);
    });

    cy.contains('Kirim').should('not.be.disabled').click();

    // Verify error message
    cy.contains('Kode OTP salah. coba lagi.').should('be.visible').then(($el) => {
      expect($el.text()).to.include('Kode OTP salah. coba lagi.');
    });

    // Clear OTP fields
    cy.get('input[data-index]').each(($el) => {
      cy.wrap($el).clear();
    });

    // Enter correct OTP
    const correctOTP = '123456';
    correctOTP.split('').forEach((num, index) => {
      cy.get(`input[data-index="${index}"]`).should('exist').type(num);
    });

    cy.contains('Kirim').click();

    cy.url().should('include', '/shop').then((url) => {
      expect(url).to.be.equal('https://recruitment-staging-queenbee.paradev.io/shop');
    });
  });

  let vaNumber; // Variable to store VA number from API

  it('should retrieve the virtual account number from API', () => {
    cy.request({
      method: 'GET',
      url: 'https://trial1b.api-qb.pti-cosmetics.com/order/INV-BBE-003429-2025',
    }).then((response) => {
      // Ensure API response is successful
      expect(response.status).to.eq(200);
      expect(response.body.errorStatus).to.be.false;

      // Extract VA number
      vaNumber = response.body.data.order.paymentVendorData.virtual_account_info.virtual_account_number;

      // Validate VA number format
      expect(vaNumber).to.be.a('string');
      expect(vaNumber).to.match(/^\d+$/);
      expect(vaNumber.length).to.be.gte(16);

      cy.log(`Extracted VA Number: ${vaNumber}`);
    });
  });

  it('should validate that the VA number is displayed correctly in the UI', () => {
    cy.visit('https://recruitment-staging-queenbee.paradev.io/checkout/payment-detail/INV-BBE-003429-2025');

    // Wait for input field to be visible
    cy.get('.chakra-input.css-1gl9l99')
      .should('be.visible')
      .should('have.value', vaNumber);

    // Log the VA number for debugging
    cy.get('.chakra-input.css-1gl9l99').invoke('val').then((uiVaNumber) => {
      cy.log(`UI VA Number: ${uiVaNumber}`);
      expect(uiVaNumber).to.equal(vaNumber);
    });
  });
});