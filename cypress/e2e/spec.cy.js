describe('visit the Teambeat home page', () => {
  
  before(()=>{
    cy.visit('http://localhost:5173/')
    
    cy.get('#email').clear();
    cy.get('#name').type('Test User');
    cy.get('#email').clear();
    cy.get('#email').type('test@test.com');
    cy.get('#password1').clear();
    cy.get('#password1').type('password');
    cy.contains('Create Account').click();
    // Check for login button
    cy.get('.navbar-link').click({force: true})
    cy.get('a[href="/logout"]')
  })
  
  after(() => {
    cy.intercept({
      method: 'POST',
      url: '/api/*', 
    }).as('postAPI')
    
    cy.visit('http://localhost:5173/account')
    cy.wait('@postAPI').then((interception) => {
      console.log(interception)
      cy.log(interception)
      cy.get('.checkbox').check();
      cy.contains('Delete Account').click();
    })
  })
  
  it('creates and account', () => {
    
    /* ==== Generated with Cypress Studio ==== */
    //cy.get('[href="/account"] > .icon-text > :nth-child(2)').click();
    assert(true).equals(true)
    /* ==== End Cypress Studio ==== */
    
  })
  
  it('creates a board', () =>{
    
  })
  
  /*
  it('logs in', () => {
    cy.visit('http://localhost:5173/login')
    cy.get('#username').type('ringmaster@midnightcircus.com');
    cy.get('#password').type('password');
    cy.get('.button').click();
    // The home page should be displayed at this time
    cy.get('.navbar-link').click({force: true})
    cy.get('a[href="/logout"]')
  })
  */
})
