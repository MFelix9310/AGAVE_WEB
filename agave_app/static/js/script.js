/**
 * AgavePredictor ML - Script principal
 * Maneja la interacción con la UI, visualización del agave y comunicación con el backend
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM - Inputs y sliders
    const alturaInput = document.getElementById('altura');
    const diametroInput = document.getElementById('diametro');
    const hojasInput = document.getElementById('hojas');
    const alturaSlider = document.getElementById('altura-slider');
    const diametroSlider = document.getElementById('diametro-slider');
    const hojasSlider = document.getElementById('hojas-slider');
    
    // Otros elementos del DOM
    const predictBtn = document.getElementById('predict-btn');
    const resultsDisplay = document.getElementById('results-display');
    const loadingIndicator = document.getElementById('loading-indicator');
    const heightInfo = document.getElementById('height-info');
    const diameterInfo = document.getElementById('diameter-info');
    const leavesInfo = document.getElementById('leaves-info');
    const leavesGroup = document.getElementById('leaves');
    const backgroundLeavesGroup = document.getElementById('background-leaves');
    const core = document.getElementById('core');
    const stem = document.getElementById('stem');
    
    // Token CSRF para peticiones POST
    const getCsrfToken = () => {
        // Intentar obtener el token de varios lugares
        const tokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (tokenElement) return tokenElement.value;
        
        // Intentar obtener de las cookies
        const csrfCookie = document.cookie.split(';')
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith('csrftoken='));
            
        if (csrfCookie) {
            return csrfCookie.split('=')[1];
        }
        
        console.warn('No se pudo obtener el token CSRF');
        return '';
    };
    
    const csrfToken = getCsrfToken();
    console.log('CSRF Token:', csrfToken);
    
    // Colores para la visualización
    const colors = {
        // Diferentes tonos de verde para las hojas - colores más realistas inspirados en la imagen
        leaves: [
            '#00848e', // turquesa oscuro
            '#00999d', // turquesa medio
            '#00a9ac', // turquesa claro 
            '#0ac1c5'  // turquesa brillante
        ],
        stem: '#006d74',
        soil: '#8a5a44'
    };
    
    // Inicialización - Aplicar animación de crecimiento al cargar
    setTimeout(() => {
        // Iniciar la animación de crecimiento después de un corto retraso
        startAgaveGrowthAnimation();
    }, 500);
    
    // Sincronizar sliders con inputs numéricos
    function syncInputWithSlider(input, slider) {
        // Actualizar input cuando el slider cambia
        slider.addEventListener('input', function() {
            input.value = slider.value;
            updateAgaveVisualization();
        });
        
        // Actualizar slider cuando el input cambia
        input.addEventListener('input', function() {
            if (input.value && !isNaN(parseFloat(input.value))) {
                slider.value = Math.min(Math.max(input.value, slider.min), slider.max);
                updateAgaveVisualization();
            }
        });
    }
    
    // Configurar sincronización para todos los inputs/sliders
    syncInputWithSlider(alturaInput, alturaSlider);
    syncInputWithSlider(diametroInput, diametroSlider);
    syncInputWithSlider(hojasInput, hojasSlider);
    
    // Inicializar la visualización con los valores predeterminados
    updateAgaveVisualization();
    
    // Manejar el clic en el botón de predicción
    predictBtn.addEventListener('click', function() {
        // Obtener valores de los inputs, con fallback a los sliders si están vacíos
        const altura = parseFloat(alturaInput.value || alturaSlider.value);
        const diametro = parseFloat(diametroInput.value || diametroSlider.value);
        const hojas = parseInt(hojasInput.value || hojasSlider.value);
        
        // Validar los datos de entrada
        if (isNaN(altura) || isNaN(diametro) || isNaN(hojas)) {
            showError('Todos los campos son requeridos y deben ser numéricos.');
            return;
        }
        
        if (altura <= 0 || diametro <= 0 || hojas <= 0) {
            showError('Todos los valores deben ser positivos.');
            return;
        }
        
        // Mostrar indicador de carga
        showLoading(true);
        
        // Preparar los datos para enviar
        const data = {
            altura: altura,
            diametro: diametro,
            hojas: hojas
        };
        
        // Realizar la petición AJAX
        fetch('/predict/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        })
        .then(response => {
            // Añadir información detallada para depuración
            console.log('Status:', response.status);
            console.log('StatusText:', response.statusText);
            console.log('Headers:', [...response.headers.entries()]);
            
            // Verificar que la respuesta sea exitosa
            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
            }
            
            // Verificar que la respuesta sea JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta del servidor no es JSON válido');
            }
            
            return response.json();
        })
        .then(result => {
            showLoading(false);
            
            if (result.success) {
                showPredictionResult(result);
                // Animar la visualización para celebrar la predicción exitosa
                animateAgaveGrowth();
            } else {
                showError(result.mensaje || 'Error al realizar la predicción');
            }
        })
        .catch(error => {
            showLoading(false);
            showError('Error al procesar la predicción: ' + error.message);
            console.error('Error detallado:', error);
            
            // Mostrar mensaje adicional sobre la causa probable
            resultsDisplay.innerHTML += `
                <p style="margin-top: 15px; font-style: italic;">
                    Nota: Es posible que el modelo de ML no esté disponible. 
                    Verifica que los archivos del modelo estén en la carpeta /model.
                </p>
            `;
        });
    });
    
    /**
     * Inicia la animación de crecimiento inicial del agave
     */
    function startAgaveGrowthAnimation() {
        const agaveContainer = document.getElementById('agave-container');
        const leaves = document.querySelectorAll('#leaves path');
        const backgroundLeaves = document.querySelectorAll('#background-leaves path');
        const spines = document.querySelector('#spines');
        const tips = document.querySelector('#tips');
        const stem = document.querySelector('#stem');
        const core = document.querySelector('#core');
        
        // Primero ocultar elementos para la animación inicial
        leaves.forEach(leaf => { leaf.style.opacity = '0'; });
        backgroundLeaves.forEach(leaf => { leaf.style.opacity = '0'; });
        if (spines) spines.style.opacity = '0';
        if (tips) tips.style.opacity = '0';
        if (stem) stem.style.opacity = '0.5';
        if (core) core.style.opacity = '0.5';
        
        // Agregar clase para activar todas las animaciones CSS
        agaveContainer.classList.add('growing-agave');
        
        // Mostrar elementos gradualmente
        setTimeout(() => {
            if (stem) stem.style.opacity = '1';
            if (core) core.style.opacity = '1';
        }, 300);
        
        // Animar las hojas del fondo una por una con retraso
        backgroundLeaves.forEach((leaf, index) => {
            setTimeout(() => {
                leaf.style.opacity = '1';
            }, 600 + (index * 150));
        });
        
        // Animar las hojas principales una por una con retraso mayor
        leaves.forEach((leaf, index) => {
            setTimeout(() => {
                leaf.style.opacity = '1';
            }, 1200 + (index * 180));
        });
        
        // Restaurar el agave a estado normal después de la animación
        setTimeout(() => {
            agaveContainer.classList.remove('growing-agave');
            
            // Aplicar animaciones continuas después del crecimiento
            leaves.forEach((leaf, index) => {
                leaf.style.animation = `leafSway ${5 + index % 3}s ease-in-out infinite`;
                leaf.style.animationDelay = `${index * 0.1}s`;
            });
        }, 5000);
    }
    
    /**
     * Simula el crecimiento del agave al cambiar parámetros
     */
    function simulateAgaveGrowth(prevValues, newValues) {
        const agaveSvg = document.getElementById('agave-svg');
        const leaves = document.querySelectorAll('#leaves path');
        const backgroundLeaves = document.querySelectorAll('#background-leaves path');
        
        // Determinar si hay un cambio significativo en altura o diámetro
        const significantHeightChange = Math.abs(newValues.altura - prevValues.altura) > 20;
        const significantDiameterChange = Math.abs(newValues.diametro - prevValues.diametro) > 15;
        const leafCountIncrease = newValues.hojas > prevValues.hojas + 5;
        
        // Si hay un cambio grande en altura, simular crecimiento vertical
        if (significantHeightChange) {
            const growUpwards = newValues.altura > prevValues.altura;
            
            // Efecto visual para la altura
            leaves.forEach((leaf, index) => {
                if (growUpwards) {
                    // Crecer hacia arriba
                    leaf.style.transform = 'scaleY(1.2)';
                    leaf.style.transformOrigin = '250px 380px';
                    setTimeout(() => {
                        leaf.style.transform = 'scaleY(1)';
                        leaf.style.transition = 'transform 0.8s ease-out';
                    }, 300);
                } else {
                    // Reducirse
                    leaf.style.transform = 'scaleY(0.9)';
                    leaf.style.transformOrigin = '250px 380px';
                    setTimeout(() => {
                        leaf.style.transform = 'scaleY(1)';
                        leaf.style.transition = 'transform 0.8s ease-out';
                    }, 300);
                }
            });
        }
        
        // Si hay un cambio grande en diámetro, simular expansión horizontal
        if (significantDiameterChange) {
            const growWider = newValues.diametro > prevValues.diametro;
            
            // Efecto visual para el diámetro
            const expansion = growWider ? 'scaleX(1.15)' : 'scaleX(0.9)';
            agaveSvg.style.transform = expansion;
            agaveSvg.style.transition = 'transform 0.5s ease-out';
            
            setTimeout(() => {
                agaveSvg.style.transform = 'scale(1)';
                agaveSvg.style.transition = 'transform 0.8s ease-out';
            }, 500);
        }
        
        // Si aumenta significativamente el número de hojas
        if (leafCountIncrease) {
            // Mostrar nuevas hojas con animación
            leaves.forEach((leaf, index) => {
                if (index >= prevValues.hojas * 0.7 && index < newValues.hojas * 0.7) {
                    leaf.style.display = 'block';
                    leaf.style.opacity = '0';
                    
                    setTimeout(() => {
                        leaf.style.opacity = '1';
                        leaf.style.transition = 'opacity 0.8s ease-out';
                    }, 300 + (index * 50));
                }
            });
        }
    }

    // Valores previos para detectar cambios
    let prevValues = {
        altura: parseFloat(alturaInput.value) || parseFloat(alturaSlider.value),
        diametro: parseFloat(diametroInput.value) || parseFloat(diametroSlider.value),
        hojas: parseInt(hojasInput.value) || parseInt(hojasSlider.value),
    };
    
    /**
     * Actualiza la visualización del agave basada en los parámetros actuales
     */
    function updateAgaveVisualization() {
        // Obtener valores actuales
        const altura = parseFloat(alturaInput.value) || parseFloat(alturaSlider.value);
        const diametro = parseFloat(diametroInput.value) || parseFloat(diametroSlider.value);
        const hojas = parseInt(hojasInput.value) || parseInt(hojasSlider.value);
        
        // Crear objeto con nuevos valores
        const newValues = { altura, diametro, hojas };
        
        // Simular crecimiento si hay cambios significativos
        simulateAgaveGrowth(prevValues, newValues);
        
        // Guardar los valores actuales como previos para la próxima vez
        prevValues = { ...newValues };
        
        // Actualizar la información mostrada
        heightInfo.textContent = `Altura: ${altura.toFixed(1)} cm`;
        diameterInfo.textContent = `Diámetro: ${diametro.toFixed(1)} cm`;
        leavesInfo.textContent = `Hojas: ${hojas}`;
        
        // Aplicar transformaciones al SVG completo
        const svg = document.getElementById('agave-svg');
        const leaves = svg.querySelectorAll('#leaves path');
        const backgroundLeaves = svg.querySelectorAll('#background-leaves path');
        const spines = svg.querySelector('#spines');
        const tips = svg.querySelector('#tips');
        const details = svg.querySelector('#details');
        const core = svg.querySelector('#core');
        const stem = svg.querySelector('#stem');
        
        // Ajustar visibilidad de espinas basado en número de hojas
        if (spines) {
            spines.style.opacity = Math.min(1, hojas / 25);
        }
        
        // Ajustar detalles basados en el tamaño
        if (details) {
            details.style.opacity = Math.min(1, diametro / 80);
        }
        
        // Escalar las hojas principales según el diámetro
        leaves.forEach((leaf, index) => {
            // Calcular visibilidad de las hojas basado en el número total
            const shouldBeVisible = index < (hojas * 0.7);
            leaf.style.display = shouldBeVisible ? 'block' : 'none';
            
            if (shouldBeVisible) {
                // Ajustar la saturación de color basada en la altura (para simular madurez)
                const currentFill = leaf.getAttribute('fill');
                if (currentFill && currentFill.startsWith('#')) {
                    // Mayor altura = colores más maduros/oscuros
                    const adjustedColor = adjustColorSaturation(currentFill, 100 + (altura - 120) / 3);
                    leaf.setAttribute('fill', adjustedColor);
                }
            }
        });
        
        // Escalar las hojas de fondo según el diámetro
        backgroundLeaves.forEach((leaf, index) => {
            // Las hojas de fondo dependen más del diámetro que del número
            const shouldBeVisible = index < (diametro / 20);
            leaf.style.display = shouldBeVisible ? 'block' : 'none';
        });
        
        // Ajustar el tamaño del núcleo basado en diámetro
        if (core) {
            const coreSize = 10 + (diametro / 15);
            core.setAttribute('rx', coreSize);
            core.setAttribute('ry', coreSize * 0.7);
        }
        
        // Ajustar el grosor del tallo basado en la altura
        if (stem) {
            const stemWidth = Math.max(3, Math.min(10, 5 + (altura / 60)));
            stem.setAttribute('stroke-width', stemWidth);
        }
    }
    
    /**
     * Ajusta la saturación de un color hexadecimal
     */
    function adjustColorSaturation(hexColor, percent) {
        // Convertir color hex a HSL
        let r = parseInt(hexColor.substr(1, 2), 16) / 255;
        let g = parseInt(hexColor.substr(3, 2), 16) / 255;
        let b = parseInt(hexColor.substr(5, 2), 16) / 255;
        
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // acromático
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        // Ajustar saturación
        s = Math.max(0, Math.min(1, s * percent / 100));
        
        // Convertir de nuevo a RGB
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
        
        // Convertir de nuevo a hex
        return '#' + 
            Math.round(r * 255).toString(16).padStart(2, '0') +
            Math.round(g * 255).toString(16).padStart(2, '0') +
            Math.round(b * 255).toString(16).padStart(2, '0');
    }
    
    /**
     * Anima el crecimiento del agave para celebrar una predicción exitosa
     */
    function animateAgaveGrowth() {
        const agaveContainer = document.getElementById('agave-container');
        const agaveSvg = document.getElementById('agave-svg');
        const leaves = document.querySelectorAll('#leaves path');
        const backgroundLeaves = document.querySelectorAll('#background-leaves path');
        const spines = document.querySelector('#spines');
        const tips = document.querySelector('#tips');
        const details = document.querySelector('#details');
        
        // Aplicar clase de crecimiento para activar animaciones CSS
        agaveContainer.classList.add('growing-agave');
        
        // Efecto de expansión más dramático
        agaveSvg.style.transition = 'all 0.8s ease-out';
        agaveSvg.style.transform = 'scale(1.1)';
        agaveSvg.style.filter = 'drop-shadow(0 6px 12px rgba(77, 128, 97, 0.8)) brightness(1.3) saturate(1.2)';
        
        // Crear un efecto de crecimiento activo simulando un cambio brusco en altura
        let currentScale = 1.0;
        const originalHeight = parseFloat(document.getElementById('height-info').textContent.match(/\d+\.\d+/)[0]);
        
        // Animar el agave como si estuviera creciendo rápidamente
        const growthInterval = setInterval(() => {
            currentScale += 0.03;
            
            // Aplicar escala vertical para simular crecimiento en altura
            leaves.forEach(leaf => {
                leaf.style.transform = `scaleY(${currentScale})`;
                leaf.style.transformOrigin = '250px 380px';
            });
            
            backgroundLeaves.forEach(leaf => {
                leaf.style.transform = `scaleY(${currentScale * 0.9})`;
                leaf.style.transformOrigin = '250px 380px';
            });
            
            // Simular aumento temporal en la información de altura
            const growingHeight = Math.min(originalHeight * 1.3, originalHeight + (currentScale - 1.0) * 50);
            heightInfo.textContent = `Altura: ${growingHeight.toFixed(1)} cm`;
            
            // Detener cuando alcance cierto límite
            if (currentScale >= 1.25) {
                clearInterval(growthInterval);
                
                // Crear efecto de "rebote" al volver a la normalidad
                setTimeout(() => {
                    leaves.forEach(leaf => {
                        leaf.style.transform = 'scaleY(0.95)';
                        leaf.style.transition = 'transform 0.6s ease-out';
                    });
                    
                    backgroundLeaves.forEach(leaf => {
                        leaf.style.transform = 'scaleY(0.95)';
                        leaf.style.transition = 'transform 0.6s ease-out';
                    });
                    
                    // Restaurar información original
                    heightInfo.textContent = `Altura: ${originalHeight.toFixed(1)} cm`;
                    
                    // Volver al tamaño normal con un efecto rebote
                    setTimeout(() => {
                        leaves.forEach(leaf => {
                            leaf.style.transform = 'scaleY(1)';
                        });
                        
                        backgroundLeaves.forEach(leaf => {
                            leaf.style.transform = 'scaleY(1)';
                        });
                        
                        agaveSvg.style.transform = 'scale(1)';
                    }, 600);
                }, 800);
            }
        }, 100);
        
        // Resaltar las espinas durante la animación
        if (spines) {
            spines.style.opacity = '1';
            spines.style.stroke = '#1D3D2A';
            spines.style.strokeWidth = '1.5';
        }
        
        // Resaltar las puntas
        if (tips) {
            tips.style.opacity = '1';
            tips.style.stroke = '#1D3D2A';
            tips.style.strokeWidth = '2.5';
        }
        
        // Mostrar todos los detalles
        if (details) {
            details.style.opacity = '1';
        }
        
        // Restaurar el estado normal después de completar la animación
        setTimeout(() => {
            agaveContainer.classList.remove('growing-agave');
            
            agaveSvg.style.filter = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))';
            
            // Restablecer propiedades de espinas y puntas
            if (spines) {
                spines.style.stroke = '#2D4D3A';
                spines.style.strokeWidth = '1';
            }
            
            if (tips) {
                tips.style.stroke = '#2D4D3A';
                tips.style.strokeWidth = '2';
            }
            
            // Aplicar animación suave de balanceo
            leaves.forEach((leaf, index) => {
                leaf.style.animation = `leafSway ${5 + index % 3}s ease-in-out infinite`;
                leaf.style.animationDelay = `${index * 0.1}s`;
            });
            
            // Actualizar visualización para asegurar valores correctos
            updateAgaveVisualization();
        }, 3000);
    }
    
    /**
     * Muestra un mensaje de error en el área de resultados
     */
    function showError(message) {
        resultsDisplay.innerHTML = `
            <p class="error-message">❌ Error</p>
            <p>${message}</p>
        `;
    }
    
    /**
     * Muestra el resultado de la predicción en el área de resultados
     */
    function showPredictionResult(result) {
        // Formatear el tiempo predicho en años y meses
        const years = Math.floor(result.prediccion);
        const months = Math.round((result.prediccion - years) * 12);
        
        resultsDisplay.innerHTML = `
            <p class="success-message">✅ Predicción Completada</p>
            <p><strong>Datos de entrada:</strong></p>
            <ul>
                <li>Altura de la planta: ${result.datos.altura} cm</li>
                <li>Diámetro de la roseta: ${result.datos.diametro} cm</li>
                <li>Número de hojas funcionales: ${result.datos.hojas}</li>
            </ul>
            <p><strong>Tiempo de crecimiento estimado:</strong></p>
            <p class="prediction-value">${years} años y ${months} meses</p>
            <p><small>Valor exacto: ${result.prediccion.toFixed(2)} años</small></p>
            <p><small>Predicción realizada con RandomForest (R² = 0.92)</small></p>
        `;
        
        // Añadir una animación simple para la visualización del resultado
        resultsDisplay.classList.add('fade-in');
        setTimeout(() => {
            resultsDisplay.classList.remove('fade-in');
        }, 1000);
    }
    
    /**
     * Muestra u oculta el indicador de carga
     */
    function showLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            resultsDisplay.classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            resultsDisplay.classList.remove('hidden');
        }
    }
}); 