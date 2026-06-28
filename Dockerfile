FROM node:18-slim

# Install system dependencies for node-llama-cpp compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port (Hugging Face Spaces exposes 7860)
ENV PORT=7860
EXPOSE 7860

# Create models directory and download a tiny model for out-of-the-box demo
RUN mkdir -p models && \
    curl -L -o models/Dolphin3.0-Llama3.2-3B-Q5_K_M.gguf \
    "https://huggingface.co/Bartowski/Dolphin3.0-Llama3.2-3B-GGUF/resolve/main/Dolphin3.0-Llama3.2-3B-Q5_K_M.gguf"

# Set permissions for Hugging Face user (UID 1000)
RUN chmod -R 777 /app

CMD ["node", "server.mjs"]
