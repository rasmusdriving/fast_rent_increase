from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
import json
from datetime import datetime
from rent_utils import extract_info_from_pdf, create_new_rent_increase_pdf

app = FastAPI()
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    with open("index.html", "r") as f:
        content = f.read()
    return content

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.filename != "":
        upload_dir = os.path.join("uploaded_files")
        os.makedirs(upload_dir, exist_ok=True)
        with open(os.path.join(upload_dir, file.filename), "wb") as f:
            f.write(await file.read())
    response = {
        "filename": file.filename
    }
    return JSONResponse(response)

@app.post("/generate")
async def generate(data: dict):
    filename = data["filename"]
    new_rent = data["new_rent"]
    application_date = datetime.strptime(data["application_date"], "%Y-%m-%d")

    print(f"filename: {filename}, new_rent: {new_rent}, application_date: {application_date}")  # Debugging line

    pdf_path = os.path.join("uploaded_files", filename)
    landlord_name, tenant_name, address, transaction_id, current_rent = extract_info_from_pdf(pdf_path)
    
    print(f"Extracted info: {landlord_name}, {tenant_name}, {address}, {transaction_id}, {current_rent}")  # Debugging line

    downloads_folder = os.path.expanduser("~/Downloads")
    output_file_name = f"Rent_Increase_{transaction_id}.docx"
    output_path = os.path.join(downloads_folder, output_file_name)

    service_fee = new_rent * 0.0495
    template_path = os.path.join("template.docx")

    create_new_rent_increase_pdf(template_path, landlord_name, tenant_name, application_date, current_rent, new_rent, service_fee, address, transaction_id, output_path)
    os.remove(pdf_path)
    print(f"Generated file: {output_file_name} at {output_path}")  # Debugging line

    response = {
        "status": "success",
        "output_path": output_file_name
    }
    return JSONResponse(response)


@app.get("/download/{filename}", include_in_schema=False)
async def download(filename: str):
    return FileResponse(f"downloads/{filename}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), log_level="info")
