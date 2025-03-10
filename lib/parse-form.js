export async function parseFormData(request) {
    const formData = await request.formData();
    const data = {};
    
    for (const entry of formData.entries()) {
      const [name, value] = entry;
      
      if (data[name]) {
        if (!Array.isArray(data[name])) {
          data[name] = [data[name]];
        }
        data[name].push(value);
      } else {
        data[name] = value;
      }
    }
    
    return data;
  }