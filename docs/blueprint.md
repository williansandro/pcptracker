# **App Name**: Pcp Tracker

## Core Features:

- Painel de Métricas: Painel com representações visuais (gráficos) das principais métricas de produtividade e produção. Considere usar bibliotecas como Chart.js ou Recharts.
- Gerenciamento de SKU: Adicionar novos SKUs (Stock Keeping Units) com um código e descrição únicos. A UI permitirá editar ou excluir cada um.
- Ordens de Produção: Criação de Ordens de Produção (OP). Permitir a seleção de um SKU e quantidade a serem produzidas. Implementar rastreamento de status (Aberto, Em Andamento, Concluído) e funcionalidade básica de cronômetro para medir o tempo de produção. Você pode querer incorporar uma 'ferramenta' que ajude a tomar decisões para melhorar os tempos de produção estimados usando análise de IA.
- Planejamento de Demanda: Insira as quantidades mensais desejadas para cada SKU e exiba o progresso em relação à meta mensal, calculando com base nas ordens de produção concluídas.

## Style Guidelines:

- Cor primária: Azul profundo (#1A237E) para transmitir confiança e eficiência.
- Cor secundária: Cinza claro (#EEEEEE) para fundos e contraste sutil.
- Destaque: Teal (#00ACC1) para elementos interativos, barras de progresso e visualizações de dados.
- Fontes limpas e sem serifa, como Roboto, para legibilidade e uma aparência moderna. Use tamanhos de fonte apropriados para títulos, rótulos e conteúdo para garantir clareza.
- Uso consistente de ícones do Material Design da biblioteca Material UI. Use ícones para representar diferentes métricas e ações, aprimorando a usabilidade.
- Use um layout de grade responsivo para se adaptar a diferentes tamanhos de tela. Estruture o painel com seções claras para diferentes métricas e ferramentas, garantindo uma interface de usuário limpa e organizada.
- Transições e animações sutis para fornecer feedback sobre as interações do usuário (por exemplo, estados de carregamento, mensagens de confirmação). Evite animações excessivas que possam distrair do conteúdo principal.