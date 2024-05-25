
'use server';

export async function handleSubmit(formData: FormData) {
  try {
    const response = await fetch('https://your-domain.com/api/contact', { // Replace 'your-domain.com' with your actual domain
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();

    if (response.ok) {
      return { success: true, responseData };
    } else {
      throw new Error(responseData.error || 'Failed to submit form');
    }
  } catch (error: any) {
    console.error('Error submitting form:', error);
    return { success: false, error: error.message || 'An error occurred while submitting the form' };
  }
}