package com.flashsale.gateway.entropy;

import java.util.Arrays;

public class ShannonConditionalEntropy {

    private static final String[] STATES = {"DETAIL", "FAV", "CART", "SECKILL"};
    private static final int N = STATES.length;
    private static final double LOG2_BASE = Math.log(2);
    private static final double EPSILON = 1e-10;

    public static int stateIndex(String state) {
        return switch (state) {
            case "DETAIL" -> 0;
            case "FAV" -> 1;
            case "CART" -> 2;
            case "SECKILL" -> 3;
            default -> -1;
        };
    }

    public static String stateName(int idx) {
        return (idx >= 0 && idx < N) ? STATES[idx] : null;
    }

    public static double compute(int[][] matrix) {
        int[] rowSums = new int[N];
        int total = 0;

        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                rowSums[i] += matrix[i][j];
            }
            total += rowSums[i];
        }

        if (total == 0) {
            return 0.0;
        }

        double h = 0.0;
        for (int i = 0; i < N; i++) {
            if (rowSums[i] == 0) continue;
            double pX = (double) rowSums[i] / total;

            double conditionalH = 0.0;
            for (int j = 0; j < N; j++) {
                if (matrix[i][j] == 0) continue;
                double pYGivenX = (double) matrix[i][j] / rowSums[i];
                if (pYGivenX > EPSILON) {
                    conditionalH -= pYGivenX * (Math.log(pYGivenX) / LOG2_BASE);
                }
            }
            h += pX * conditionalH;
        }

        return h;
    }

    public static String classify(double entropy) {
        if (entropy >= 1.5 && entropy <= 3.5) {
            return "GREEN";
        } else if (entropy < 0.5) {
            return "BLACK";
        } else {
            return "YELLOW";
        }
    }

    public static String[] getStates() {
        return STATES;
    }

    public static int getStateCount() {
        return N;
    }
}
