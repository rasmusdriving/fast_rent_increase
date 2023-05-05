window.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'http://localhost:8000'; // Replace with your Heroku app URL
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file');
    const newRent = document.getElementById('new-rent');
    const applicationDate = document.getElementById('application-date');
    const message = document.getElementById('message');
  
    let uploadedFilename = null;
  
    fileInput.addEventListener('change', async (event) => {
      if (event.target.files.length > 0) {
        const formData = new FormData();
        formData.append('file', event.target.files[0]);
  
        // Upload file
        const uploadResponse = await fetch(`${backendUrl}/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        uploadedFilename = uploadResult.filename;
      }
    });
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      if (!uploadedFilename) {
        message.textContent = 'Error: No file uploaded.';
        return;
      }
  
      // Generate rent increase
      const generateResponse = await fetch(`${backendUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadedFilename,
          new_rent: parseInt(newRent.value),
          application_date: applicationDate.value,
        }),
      });
      const generateResult = await generateResponse.json();
  
      if (generateResult.status === 'success') {
        message.textContent = 'Rent increase generated successfully! ';
        const downloadLink = document.createElement('a');
        downloadLink.href = `${backendUrl}/download/${generateResult.output_path}`;
        downloadLink.textContent = 'Download';
        message.appendChild(downloadLink);
      } else {
        message.textContent = 'Error: Rent increase generation failed.';
      }
    });
  });
  