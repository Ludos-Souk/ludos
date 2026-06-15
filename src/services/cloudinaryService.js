const CLOUD_NAME = "dbvmrjqcb";
const UPLOAD_PRESET = "ludos.store";

export async function uploadImagem(arquivo) {

    const formData = new FormData();

    formData.append(
        "file",
        arquivo
    );

    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );

    const resposta =
        await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );

    const dados =
        await resposta.json();

    if (!resposta.ok) {

        throw new Error(
            dados.error?.message ||
            "Erro ao enviar imagem."
        );

    }

    return {
        url: dados.secure_url,
        publicId: dados.public_id
    };

}