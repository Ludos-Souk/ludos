import { aguardarUsuario } from "../../../services/authService.js";
import { usuarioJaFezPedido } from "../../../services/pedidoService.js";

export async function configurarPromocaoPrimeiraCompra({ banner, header, conteudo }) {
    if (!banner) return false;

    banner.hidden = true;

    try {
        const usuario = await aguardarUsuario();
        const elegivel = Boolean(usuario?.uid) && !(await usuarioJaFezPedido(usuario.uid));

        if (elegivel) {
            banner.hidden = false;
            header?.classList.remove("sem-banner");
            conteudo?.style.removeProperty("margin-top");
            return true;
        }
    } catch (erro) {
        console.error("Não foi possível validar a promoção de primeira compra:", erro);
    }

    header?.classList.add("sem-banner");
    if (conteudo) conteudo.style.marginTop = "var(--main-margin-reduced)";
    return false;
}
