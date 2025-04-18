document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const WEBHOOK_URL = 'https://akamai223.app.n8n.cloud/webhook/inscription';
  const FORM_ID = 'applicationForm';
  const STEPS_CLASS = 'form-step';
  const ACTIVE_CLASS = 'active';
  
  // Éléments DOM
  const form = document.getElementById(FORM_ID);
  const formSteps = document.querySelectorAll(`.${STEPS_CLASS}`);
  const responseContainer = document.getElementById('response-container');
  const responseContent = document.getElementById('webhook-response');
  const returnBtn = document.getElementById('return-btn');
  


  let param = new URLSearchParams(window.location.search) ;
  let   detail = param.get("detail") ;


  let htmlCode = decodeURIComponent(detail) ;




  // Variables d'état
  let currentStep = 0;
  
  // Initialisation
  showStep(currentStep);
  
  // Navigation entre les étapes
  function showStep(step) {
      formSteps.forEach((stepElement, index) => {
          stepElement.classList.toggle(ACTIVE_CLASS, index === step);
      });
  }
  
  // Gestion des événements
  document.querySelectorAll('.btn-next').forEach(button => {
      button.addEventListener('click', nextStep);
  });
  
  document.querySelectorAll('.btn-prev').forEach(button => {
      button.addEventListener('click', prevStep);
  });
  
  if (returnBtn) {
      returnBtn.addEventListener('click', resetForm);
  }
  
  form.addEventListener('submit', handleSubmit);
  
  // Fonctions de navigation
  function nextStep() {
      if (validateStep(currentStep)) {
          currentStep++;
          showStep(currentStep);
      }
  }
  
  function prevStep() {
      currentStep--;
      showStep(currentStep);
  }
  
  function resetForm() {
      responseContainer.style.display = 'none';
      form.style.display = 'block';
      form.reset();
      currentStep = 0;
      showStep(currentStep);
  }
  
  // Validation
  function validateStep(step) {
      let isValid = true;
      const stepFields = formSteps[step].querySelectorAll('[required]');
      
      stepFields.forEach(field => {
          if (!field.value.trim()) {
              markAsInvalid(field);
              isValid = false;
          } else {
              markAsValid(field);
          }
      });
      
      return isValid;
  }
  
  function markAsInvalid(field) {
      field.classList.add('error');
      if (!field.nextElementSibling?.classList.contains('error-message')) {
          const errorMsg = document.createElement('span');
          errorMsg.className = 'error-message';
          errorMsg.textContent = 'Ce champ est requis';
          field.parentNode.insertBefore(errorMsg, field.nextSibling);
      }
  }
  
  function markAsValid(field) {
      field.classList.remove('error');
      if (field.nextElementSibling?.classList.contains('error-message')) {
          field.nextElementSibling.remove();
      }
  }
  
  // Soumission du formulaire
  async function handleSubmit(e) {
      e.preventDefault();
      
      if (!validateAllSteps()) return;
      
      try {
          const formData = prepareFormData();
          const response = await sendToWebhook(formData);
          showWebhookResponse(response);
      } catch (error) {
          console.error('Submission error:', error);
          showErrorResponse(error);
      }
  }
  
  function prepareFormData() {
      return {
          nom: document.getElementById('lastname').value,
          prenom: document.getElementById('firstname').value,
          telephone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          disponibilites: document.getElementById('availability').value,
          niveau_etudes: document.getElementById('education').value,
          methode_paiement: document.getElementById('payment_method').value,
          date_soumission: new Date().toISOString(),
          poste:htmlCode
      };
  }
  
  async function sendToWebhook(data) {
      const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });
      
      if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      return await response.json();
  }
  
  function validateAllSteps() {
      for (let i = 0; i < formSteps.length; i++) {
          if (!validateStep(i)) {
              currentStep = i;
              showStep(currentStep);
              return false;
          }
      }
      return true;
  }
  
  // Affichage des résultats
  function showWebhookResponse(data) {
      form.style.display = 'none';
      responseContainer.style.display = 'block';
      
      const formattedDate = data.timestamp ? 
          new Date(data.timestamp).toLocaleString('fr-FR') : 
          new Date().toLocaleString('fr-FR');
      
      responseContent.innerHTML = `
          <div class="response-header">
              <h2>${data.status === 'success' ? '✅' : '❌'} ${data.message || 'Résultat de votre candidature'}</h2>
          </div>
          <div class="response-body">
              ${data.matricule ? `
              <div class="response-item">
                  <strong>Matricule:</strong>
                  <span>${cleanMatricule(data.matricule)}</span>
              </div>
              ` : ''}
              
              ${data.next_steps ? `
              <div class="response-item">
                  <strong>Prochaines étapes:</strong>
                  <p>${data.next_steps}</p>
              </div>
              ` : ''}
              
              ${data.contact_email ? `
              <div class="response-item">
                  <strong>Contact:</strong>
                  <a href="mailto:${data.contact_email}">${data.contact_email}</a>
              </div>
              ` : ''}
              
              <div class="response-item timestamp">
                  <em>Envoyé le ${formattedDate}</em>
              </div>
          </div>
      `;
  }
  
  function showErrorResponse(error) {
      form.style.display = 'none';
      responseContainer.style.display = 'block';
      
      responseContent.innerHTML = `
          <div class="error-message">
              <h3>❌ Erreur lors de la soumission</h3>
              <p>${error.message || 'Une erreur est survenue lors de l\'envoi de votre candidature.'}</p>
              <p>Veuillez réessayer ou contacter le support.</p>
          </div>
      `;
  }
  
  // Helper function
  function cleanMatricule(matricule) {
      return matricule.replace('AKA-{{ $("Code").item.json.matricule }}', 'AKA-XXXXXX');
  }
});